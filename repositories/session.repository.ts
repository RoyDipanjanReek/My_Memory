import { connectToDatabase } from "@/lib/mongodb";
import AuthSessionModel from "@/models/AuthSession";
import UserModel from "@/models/User";
import type { AuthSessionRecord, AuthUserRecord, UserRole } from "@/types/auth.types";

type LeanSession = {
  _id: { toString(): string };
  userId: { toString(): string };
  tokenHash: string;
  expiresAt: Date;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type LeanSessionWithUser = LeanSession & {
  user: {
    _id: { toString(): string };
    name: string;
    email: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

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

export async function getSessionWithUserByTokenHash(tokenHash: string) {
  await connectToDatabase();

  const sessions = await AuthSessionModel.aggregate<LeanSessionWithUser>([
    {
      $match: {
        tokenHash,
        expiresAt: { $gt: new Date() }
      }
    },
    {
      $lookup: {
        from: UserModel.collection.name,
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true
      }
    },
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

export async function deleteSessionByTokenHash(tokenHash: string) {
  await connectToDatabase();
  await AuthSessionModel.deleteOne({ tokenHash });
}
