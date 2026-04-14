// Authentication Service
// Handles user login, registration, session management, and password hashing
// Core business logic for authentication operations

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { ZodError, z } from "zod";
import {
  createSession,
  deleteSessionByTokenHash,
  getSessionWithUserByTokenHash,
  touchSession
} from "@/repositories/session.repository";
import { createUser, getUserByEmail } from "@/repositories/user.repository";
import type { AuthUserRecord, LoginInput, RegisterInput, UserRole } from "@/types/auth.types";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(60),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(1, "Password is required.")
});

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

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

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildSessionPayload(user: AuthUserRecord) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  return {
    rawToken,
    tokenHash,
    expiresAt,
    user
  };
}

export async function registerUser(input: RegisterInput) {
  const parsed = parseWithSchema(registerSchema, input);
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

  const session = buildSessionPayload(user);
  await createSession({
    userId: user.id,
    tokenHash: session.tokenHash,
    expiresAt: session.expiresAt
  });

  return {
    user,
    sessionToken: session.rawToken,
    expiresAt: session.expiresAt
  };
}

export async function loginUser(input: LoginInput) {
  const parsed = parseWithSchema(loginSchema, input);
  const user = await getUserByEmail(parsed.email);

  if (!user || !verifyPassword(parsed.password, user.passwordHash)) {
    throw new AuthenticationError("Invalid email or password.");
  }

  const session = buildSessionPayload({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  });

  await createSession({
    userId: user._id.toString(),
    tokenHash: session.tokenHash,
    expiresAt: session.expiresAt
  });

  return {
    user: session.user,
    sessionToken: session.rawToken,
    expiresAt: session.expiresAt
  };
}

export async function getAuthenticatedUser(sessionToken: string | undefined | null) {
  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashSessionToken(sessionToken);
  const { session, user } = await getSessionWithUserByTokenHash(tokenHash);

  if (!session || !user) {
    return null;
  }

  await touchSession(tokenHash);
  return user;
}

export async function requireAuthenticatedUser(sessionToken: string | undefined | null) {
  const user = await getAuthenticatedUser(sessionToken);

  if (!user) {
    throw new AuthenticationError("You need to sign in first.");
  }

  return user;
}

export function assertAuthorizedRole(user: AuthUserRecord, allowedRoles: UserRole[]) {
  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError("You do not have permission for this action.");
  }
}

export async function logoutUser(sessionToken: string | undefined | null) {
  if (!sessionToken) {
    return;
  }

  await deleteSessionByTokenHash(hashSessionToken(sessionToken));
}
