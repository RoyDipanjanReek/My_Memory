import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/models/User";
import type { AuthUserRecord, UserRole } from "@/types/auth.types";

type LeanUser = {
  _id: { toString(): string };
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
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
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

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

export async function getUserByEmail(email: string) {
  await connectToDatabase();
  return UserModel.findOne({ email: email.toLowerCase().trim() }).lean<LeanUser | null>();
}

export async function getUserRecordById(id: string) {
  await connectToDatabase();
  const user = await UserModel.findById(id).lean<LeanUser | null>();
  return toUserRecord(user);
}
