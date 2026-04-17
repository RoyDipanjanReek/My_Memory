// Authentication type definitions
// Defines interfaces and types for users, sessions, and auth-related data

// Available user roles for authorization
export const USER_ROLES = ["admin", "member"] as const;
export const AUTH_TOKEN_TYPES = ["email_verification", "password_reset"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type AuthTokenType = (typeof AUTH_TOKEN_TYPES)[number];

export interface AuthUserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerifiedAt: string | null;
  passwordChangedAt: string | null;
  failedLoginCount: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  deviceLabel: string | null;
  expiresAt: string;
  lastUsedAt: string;
  lastRotatedAt: string;
  rotatedFromId: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  type: AuthTokenType;
  expiresAt: string;
  consumedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionDeviceInfo {
  userAgent?: string | null;
  ipAddress?: string | null;
  deviceLabel?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}

export interface EmailVerificationRequestInput {
  email?: string;
}

export interface EmailVerificationConfirmInput {
  token: string;
}

export interface PasswordResetRequestInput {
  email: string;
}

export interface PasswordResetConfirmInput {
  token: string;
  password: string;
}
