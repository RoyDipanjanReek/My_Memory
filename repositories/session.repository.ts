// Authentication Session Repository - Data access layer for session operations
// Handles all database queries related to user sessions and authentication

import { connectToDatabase } from "@/lib/mongodb";
import AuthSessionModel from "@/models/AuthSession";
import UserModel from "@/models/User";
import type { AuthSessionRecord, AuthUserRecord, UserRole } from "@/types/auth.types";

/**
 * Type for raw session document from MongoDB
 */
type LeanSession = {
  _id: { toString(): string };
  userId: { toString(): string };
  tokenHash: string;
  expiresAt: Date;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Type for session document joined with user data
 */
type LeanSessionWithUser = LeanSession & {
  user:
    | {
        _id: { toString(): string };
        name: string;
        email: string;
        role: UserRole;
        createdAt: Date;
        updatedAt: Date;
      }
    | null;
};

/**
 * Converts raw session document to application session record
 * @param session - Raw session from database
 * @returns Formatted session record or null
 */
function toSessionRecord(session: LeanSession | null): AuthSessionRecord | null {
  if (!session) {
    return null;
  }

  return {
    id: session._id.toString(),
    userId: session.userId.toString(),
    tokenHash: session.tokenHash,
    expiresAt: session.expiresAt.toISOString(),
    lastUsedAt: session.lastUsedAt.toISOString(),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString()
  };
}

/**
 * Converts user data from session join to application user record
 * @param user - User data from session join
 * @returns Formatted user record or null
 */
function toUserRecord(user: LeanSessionWithUser["user"]): AuthUserRecord | null {
  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

/**
 * Creates a new authentication session in the database
 * @param data - Session data to create
 * @returns Created session record
 */
export async function createSession(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  await connectToDatabase();
  const created = await AuthSessionModel.create({
    ...data,
    lastUsedAt: new Date()
  });

  return toSessionRecord(created.toObject<LeanSession>());
}

/**
 * Retrieves a session with its associated user data by token hash
 * Only returns non-expired sessions
 * Uses MongoDB aggregation and lookup for efficient join
 * @param tokenHash - Hash of the authentication token
 * @returns Object with session and user records
 */
export async function getSessionWithUserByTokenHash(tokenHash: string) {
  await connectToDatabase();

  // Aggregate to get session with user data in a single query
  const sessions = await AuthSessionModel.aggregate<LeanSessionWithUser>([
    // Match session by token hash and check expiration
    {
      $match: {
        tokenHash,
        expiresAt: { $gt: new Date() } // Only non-expired sessions
      }
    },
    // Join with Users collection
    {
      $lookup: {
        from: UserModel.collection.name,
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    // Unwind user array to single document (or null)
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true
      }
    },
    // Limit to one result
    {
      $limit: 1
    }
  ]);

  const session = sessions[0] ?? null;

  return {
    session: toSessionRecord(session),
    user: toUserRecord(session?.user ?? null)
  };
}

/**
 * Updates the lastUsedAt timestamp for a session
 * Called every time a session is used for authentication
 * @param tokenHash - Hash of the authentication token
 */
export async function touchSession(tokenHash: string) {
  await connectToDatabase();
  await AuthSessionModel.updateOne(
    { tokenHash },
    {
      $set: {
        lastUsedAt: new Date()
      }
    }
  );
}

/**
 * Deletes a session by token hash (logout)
 * @param tokenHash - Hash of the authentication token
 */
export async function deleteSessionByTokenHash(tokenHash: string) {
  await connectToDatabase();
  await AuthSessionModel.deleteOne({ tokenHash });
}
