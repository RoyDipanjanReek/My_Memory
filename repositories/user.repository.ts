// User Repository - Data access layer for user operations
// Handles all database queries related to users

import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/models/User";
import type { AuthUserRecord, UserRole } from "@/types/auth.types";

type LeanUser = {
  _id: { toString(): string };
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  emailVerifiedAt: Date | null;
  passwordChangedAt: Date | null;
  failedLoginCount: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toUserRecord(user: LeanUser | null): AuthUserRecord | null {
  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    passwordChangedAt: user.passwordChangedAt ? user.passwordChangedAt.toISOString() : null,
    failedLoginCount: user.failedLoginCount ?? 0,
    lockedUntil: user.lockedUntil ? user.lockedUntil.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
  emailVerifiedAt?: Date | null;
}) {
  await connectToDatabase();
  const created = await UserModel.create({
    ...data,
    role: data.role ?? "member",
    emailVerifiedAt: data.emailVerifiedAt ?? null
  });

  return toUserRecord(created.toObject<LeanUser>());
}

export async function getUserByEmail(email: string) {
  await connectToDatabase();
  return UserModel.findOne({ email: email.toLowerCase().trim() }).lean<LeanUser | null>();
}

export async function getUserRecordById(id: string) {
  await connectToDatabase();
  const user = await UserModel.findById(id).lean<LeanUser | null>();
  return toUserRecord(user);
}

export async function updateUserById(id: string, update: Record<string, unknown>) {
  await connectToDatabase();
  const user = await UserModel.findByIdAndUpdate(id, update, {
    new: true
  }).lean<LeanUser | null>();

  return toUserRecord(user);
}

export async function incrementFailedLogin(userId: string, lockUntil?: Date | null) {
  await connectToDatabase();
  const update: Record<string, unknown> = {
    $inc: {
      failedLoginCount: 1
    }
  };

  if (lockUntil) {
    update.$set = {
      lockedUntil: lockUntil
    };
  }

  const user = await UserModel.findByIdAndUpdate(userId, update, {
    new: true
  }).lean<LeanUser | null>();

  return toUserRecord(user);
}

export async function resetFailedLogin(userId: string) {
  await connectToDatabase();
  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        failedLoginCount: 0,
        lockedUntil: null
      }
    },
    {
      new: true
    }
  ).lean<LeanUser | null>();

  return toUserRecord(user);
}
