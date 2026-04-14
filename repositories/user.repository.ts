// User Repository - Data access layer for user operations
// Handles all database queries related to users

import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/models/User";
import type { AuthUserRecord, UserRole } from "@/types/auth.types";

/**
 * Type for raw user document from MongoDB
 * Similar to UserDocument but with lean() applied
 */
type LeanUser = {
  _id: { toString(): string };
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Converts a raw database user to an application user record
 * Handles null values and ObjectId conversions
 * @param user - Raw user from database
 * @returns Formatted user record or null
 */
function toUserRecord(user: LeanUser | null): AuthUserRecord | null {
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
 * Creates a new user in the database
 * Defaults role to "member" if not provided
 * @param data - User data to create
 * @returns Created user record
 */
export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}) {
  await connectToDatabase();
  const created = await UserModel.create({
    ...data,
    role: data.role ?? "member"
  });

  return toUserRecord(created.toObject<LeanUser>());
}

/**
 * Finds a user by email address
 * Email is case-insensitive and trimmed
 * @param email - Email address to search for
 * @returns User object or null if not found
 */
export async function getUserByEmail(email: string) {
  await connectToDatabase();
  return UserModel.findOne({ email: email.toLowerCase().trim() }).lean<LeanUser | null>();
}

/**
 * Retrieves a formatted user record by ID
 * @param id - User ID (MongoDB ObjectId as string)
 * @returns Formatted user record or null if not found
 */
export async function getUserRecordById(id: string) {
  await connectToDatabase();
  const user = await UserModel.findById(id).lean<LeanUser | null>();
  return toUserRecord(user);
}
