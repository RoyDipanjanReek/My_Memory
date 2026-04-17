// Authentication Service
// Handles registration, login, verification, password reset, session lifecycle, and authorization

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { ZodError } from "zod";
import { recordAuditEvent } from "@/lib/audit";
import { deriveDeviceLabel } from "@/lib/security";
import { validateRuntimeSecurityConfig } from "@/lib/runtime-config";
import {
  createAuthToken,
  consumeAuthToken,
  deleteActiveTokensForUser,
  getValidAuthTokenByHash
} from "@/repositories/auth-token.repository";
import {
  createSession,
  deleteSessionByTokenHash,
  getSessionWithUserByTokenHash,
  listActiveSessionsForUser,
  revokeOtherSessions,
  revokeSessionById,
  revokeSessionsForUser,
  touchSession,
  updateSessionRotation
} from "@/repositories/session.repository";
import {
  createUser,
  getUserByEmail,
  getUserRecordById,
  incrementFailedLogin,
  resetFailedLogin,
  updateUserById
} from "@/repositories/user.repository";
import type {
  AuthSessionRecord,
  AuthUserRecord,
  EmailVerificationConfirmInput,
  LoginInput,
  PasswordResetConfirmInput,
  PasswordResetRequestInput,
  RegisterInput,
  SessionDeviceInfo,
  UserRole
} from "@/types/auth.types";
import type { RequestContext } from "@/types/observability.types";
import {
  authLoginSchema,
  authRegisterSchema,
  emailTokenSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema
} from "@/lib/validation";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_ROTATION_MS = 1000 * 60 * 60 * 24;
const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;
const PASSWORD_RESET_TTL_MS = 1000 * 60 * 30;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 1000 * 60 * 15;

validateRuntimeSecurityConfig();

export class AuthValidationError extends Error {
  statusCode = 400;
}

export class AuthenticationError extends Error {
  statusCode = 401;
}

export class AuthorizationError extends Error {
  statusCode = 403;
}

function parseWithSchema<T>(parser: { parse(input: unknown): T }, input: unknown) {
  try {
    return parser.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AuthValidationError(error.issues[0]?.message ?? "Invalid input.");
    }

    throw error;
  }
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password: string, passwordHash: string) {
  const [salt, expectedHash] = passwordHash.split(":");

  if (!salt || !expectedHash) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (derivedKey.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedBuffer);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildSessionPayload(user: AuthUserRecord) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  return {
    rawToken,
    tokenHash,
    expiresAt,
    user
  };
}

function withDeviceDefaults(session: SessionDeviceInfo = {}): SessionDeviceInfo {
  return {
    userAgent: session.userAgent ?? null,
    ipAddress: session.ipAddress ?? null,
    deviceLabel: session.deviceLabel ?? deriveDeviceLabel(session.userAgent)
  };
}

function isLocked(user: {
  lockedUntil?: string | null;
} | null) {
  if (!user?.lockedUntil) {
    return false;
  }

  return new Date(user.lockedUntil).getTime() > Date.now();
}

async function issueAuthToken(userId: string, type: "email_verification" | "password_reset", ttlMs: number) {
  await deleteActiveTokensForUser(userId, type);

  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ttlMs);

  await createAuthToken({
    userId,
    tokenHash: hashToken(rawToken),
    type,
    expiresAt
  });

  return {
    token: rawToken,
    expiresAt
  };
}

async function createUserSession(
  user: AuthUserRecord,
  session: SessionDeviceInfo,
  rotatedFromId?: string | null
) {
  const payload = buildSessionPayload(user);

  await createSession({
    userId: user.id,
    tokenHash: payload.tokenHash,
    expiresAt: payload.expiresAt,
    session: withDeviceDefaults(session),
    rotatedFromId
  });

  return {
    sessionToken: payload.rawToken,
    expiresAt: payload.expiresAt
  };
}

export function assertAuthorizedRole(user: AuthUserRecord, allowedRoles: UserRole[]) {
  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError("You do not have permission for this action.");
  }
}

export function assertCanAccessOwner(actor: AuthUserRecord, ownerId: string) {
  if (actor.role !== "admin" && actor.id !== ownerId) {
    throw new AuthorizationError("You do not have permission for this resource.");
  }
}

export async function registerUser(
  input: RegisterInput,
  session: SessionDeviceInfo = {},
  context?: RequestContext
) {
  const parsed = parseWithSchema(authRegisterSchema, input);
  const existing = await getUserByEmail(parsed.email);

  if (existing) {
    throw new AuthValidationError("An account with that email already exists.");
  }

  const user = await createUser({
    name: parsed.name,
    email: parsed.email,
    passwordHash: hashPassword(parsed.password),
    role: "member"
  });

  if (!user) {
    throw new Error("Failed to create user.");
  }

  const verification = await issueAuthToken(user.id, "email_verification", EMAIL_VERIFICATION_TTL_MS);
  const createdSession = await createUserSession(user, session);

  await recordAuditEvent({
    actorId: user.id,
    ownerId: user.id,
    action: "auth.register",
    entityType: "user",
    entityId: user.id,
    status: "success",
    metadata: {
      emailVerified: false
    },
    context
  });

  return {
    user,
    sessionToken: createdSession.sessionToken,
    expiresAt: createdSession.expiresAt,
    verificationToken: process.env.NODE_ENV === "production" ? undefined : verification.token
  };
}

export async function loginUser(
  input: LoginInput,
  session: SessionDeviceInfo = {},
  context?: RequestContext
) {
  const parsed = parseWithSchema(authLoginSchema, input);
  const user = await getUserByEmail(parsed.email);

  if (!user) {
    throw new AuthenticationError("Invalid email or password.");
  }

  const safeUser = await getUserRecordById(user._id.toString());

  if (!safeUser) {
    throw new AuthenticationError("Invalid email or password.");
  }

  if (isLocked(safeUser)) {
    throw new AuthenticationError("Account temporarily locked. Please try again later.");
  }

  if (!verifyPassword(parsed.password, user.passwordHash)) {
    const nextFailedAttempts = (safeUser.failedLoginCount ?? 0) + 1;
    const lockUntil =
      nextFailedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_DURATION_MS)
        : null;

    await incrementFailedLogin(safeUser.id, lockUntil);
    await recordAuditEvent({
      actorId: safeUser.id,
      ownerId: safeUser.id,
      action: "auth.login",
      entityType: "user",
      entityId: safeUser.id,
      status: "failure",
      metadata: {
        reason: "invalid_password"
      },
      context
    });

    throw new AuthenticationError("Invalid email or password.");
  }

  await resetFailedLogin(safeUser.id);
  const createdSession = await createUserSession(safeUser, session);

  await recordAuditEvent({
    actorId: safeUser.id,
    ownerId: safeUser.id,
    action: "auth.login",
    entityType: "session",
    entityId: safeUser.id,
    status: "success",
    context
  });

  return {
    user: safeUser,
    sessionToken: createdSession.sessionToken,
    expiresAt: createdSession.expiresAt
  };
}

export async function getAuthenticatedSession(
  sessionToken: string | undefined | null,
  _context?: RequestContext
) {
  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashToken(sessionToken);
  const { session, user } = await getSessionWithUserByTokenHash(tokenHash);

  if (!session || !user) {
    return null;
  }

  let rotatedToken: string | null = null;
  let expiresAt = new Date(session.expiresAt);

  if (Date.now() - new Date(session.lastRotatedAt).getTime() >= SESSION_ROTATION_MS) {
    const payload = buildSessionPayload(user);
    const updatedSession = await updateSessionRotation(session.id, payload.tokenHash, payload.expiresAt);

    if (updatedSession) {
      rotatedToken = payload.rawToken;
      expiresAt = payload.expiresAt;
    }
  } else {
    await touchSession(tokenHash);
  }

  return {
    user,
    session,
    rotatedToken,
    expiresAt
  };
}

export async function getAuthenticatedUser(sessionToken: string | undefined | null) {
  const result = await getAuthenticatedSession(sessionToken);
  return result?.user ?? null;
}

export async function requireAuthenticatedSession(
  sessionToken: string | undefined | null,
  context?: RequestContext
) {
  const session = await getAuthenticatedSession(sessionToken, context);

  if (!session) {
    throw new AuthenticationError("You need to sign in first.");
  }

  return session;
}

export async function requireAuthenticatedUser(
  sessionToken: string | undefined | null,
  context?: RequestContext
) {
  const session = await requireAuthenticatedSession(sessionToken, context);
  return session.user;
}

export async function requestEmailVerification(
  actor: AuthUserRecord,
  context?: RequestContext
) {
  const verification = await issueAuthToken(actor.id, "email_verification", EMAIL_VERIFICATION_TTL_MS);

  await recordAuditEvent({
    actorId: actor.id,
    ownerId: actor.id,
    action: "auth.email_verification_requested",
    entityType: "user",
    entityId: actor.id,
    status: "success",
    context
  });

  return {
    token: process.env.NODE_ENV === "production" ? undefined : verification.token,
    expiresAt: verification.expiresAt
  };
}

export async function verifyEmailToken(
  input: EmailVerificationConfirmInput,
  context?: RequestContext
) {
  const parsed = parseWithSchema(emailTokenSchema, input);
  const token = await getValidAuthTokenByHash(hashToken(parsed.token), "email_verification");

  if (!token) {
    throw new AuthValidationError("Verification token is invalid or expired.");
  }

  const user = await updateUserById(token.userId, {
    $set: {
      emailVerifiedAt: new Date()
    }
  });

  await consumeAuthToken(token.id);

  if (user) {
    await recordAuditEvent({
      actorId: user.id,
      ownerId: user.id,
      action: "auth.email_verified",
      entityType: "user",
      entityId: user.id,
      status: "success",
      context
    });
  }

  return user;
}

export async function requestPasswordReset(
  input: PasswordResetRequestInput,
  context?: RequestContext
) {
  const parsed = parseWithSchema(passwordResetRequestSchema, input);
  const user = await getUserByEmail(parsed.email);

  if (!user) {
    return {
      token: undefined as string | undefined
    };
  }

  const reset = await issueAuthToken(user._id.toString(), "password_reset", PASSWORD_RESET_TTL_MS);

  await recordAuditEvent({
    actorId: user._id.toString(),
    ownerId: user._id.toString(),
    action: "auth.password_reset_requested",
    entityType: "user",
    entityId: user._id.toString(),
    status: "success",
    context
  });

  return {
    token: process.env.NODE_ENV === "production" ? undefined : reset.token
  };
}

export async function resetPasswordWithToken(
  input: PasswordResetConfirmInput,
  session: SessionDeviceInfo = {},
  context?: RequestContext
) {
  const parsed = parseWithSchema(passwordResetConfirmSchema, input);
  const token = await getValidAuthTokenByHash(hashToken(parsed.token), "password_reset");

  if (!token) {
    throw new AuthValidationError("Reset token is invalid or expired.");
  }

  const updatedUser = await updateUserById(token.userId, {
    $set: {
      passwordHash: hashPassword(parsed.password),
      passwordChangedAt: new Date(),
      failedLoginCount: 0,
      lockedUntil: null
    }
  });

  await consumeAuthToken(token.id);
  await revokeSessionsForUser(token.userId);

  if (!updatedUser) {
    throw new AuthenticationError("User could not be loaded.");
  }

  const createdSession = await createUserSession(updatedUser, session);

  await recordAuditEvent({
    actorId: updatedUser.id,
    ownerId: updatedUser.id,
    action: "auth.password_reset_completed",
    entityType: "user",
    entityId: updatedUser.id,
    status: "success",
    context
  });

  return {
    user: updatedUser,
    sessionToken: createdSession.sessionToken,
    expiresAt: createdSession.expiresAt
  };
}

export async function listUserSessions(actor: AuthUserRecord, targetUserId?: string) {
  const ownerId = targetUserId ?? actor.id;
  assertCanAccessOwner(actor, ownerId);
  return listActiveSessionsForUser(ownerId);
}

export async function revokeSessionForActor(
  actor: AuthUserRecord,
  sessionId: string,
  targetUserId?: string,
  context?: RequestContext
) {
  const ownerId = targetUserId ?? actor.id;
  assertCanAccessOwner(actor, ownerId);

  const session = await revokeSessionById(ownerId, sessionId);

  await recordAuditEvent({
    actorId: actor.id,
    ownerId,
    action: "auth.session_revoked",
    entityType: "session",
    entityId: sessionId,
    status: session ? "success" : "failure",
    context
  });

  return session;
}

export async function revokeOtherUserSessions(
  actor: AuthUserRecord,
  currentSessionId: string | null,
  context?: RequestContext
) {
  await revokeOtherSessions(actor.id, currentSessionId);

  await recordAuditEvent({
    actorId: actor.id,
    ownerId: actor.id,
    action: "auth.other_sessions_revoked",
    entityType: "session",
    entityId: currentSessionId,
    status: "success",
    context
  });
}

export async function logoutUser(
  sessionToken: string | undefined | null,
  actor?: AuthUserRecord | null,
  context?: RequestContext
) {
  if (!sessionToken) {
    return;
  }

  await deleteSessionByTokenHash(hashToken(sessionToken));

  if (actor) {
    await recordAuditEvent({
      actorId: actor.id,
      ownerId: actor.id,
      action: "auth.logout",
      entityType: "session",
      entityId: actor.id,
      status: "success",
      context
    });
  }
}
