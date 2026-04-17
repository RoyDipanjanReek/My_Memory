// Authentication Session Repository - Data access layer for session operations
// Handles all database queries related to user sessions and authentication

import { connectToDatabase } from "@/lib/mongodb";
import AuthSessionModel from "@/models/AuthSession";
import UserModel from "@/models/User";
import type {
  AuthSessionRecord,
  AuthUserRecord,
  SessionDeviceInfo,
  UserRole
} from "@/types/auth.types";

type LeanSession = {
  _id: { toString(): string };
  userId: { toString(): string };
  tokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  deviceLabel: string | null;
  expiresAt: Date;
  lastUsedAt: Date;
  lastRotatedAt: Date;
  revokedAt: Date | null;
  rotatedFromId: { toString(): string } | null;
  createdAt: Date;
  updatedAt: Date;
};

type LeanSessionWithUser = LeanSession & {
  user:
    | {
        _id: { toString(): string };
        name: string;
        email: string;
        role: UserRole;
        emailVerifiedAt: Date | null;
        passwordChangedAt: Date | null;
        failedLoginCount: number;
        lockedUntil: Date | null;
        createdAt: Date;
        updatedAt: Date;
      }
    | null;
};

function toSessionRecord(session: LeanSession | null): AuthSessionRecord | null {
  if (!session) {
    return null;
  }

  return {
    id: session._id.toString(),
    userId: session.userId.toString(),
    tokenHash: session.tokenHash,
    userAgent: session.userAgent ?? null,
    ipAddress: session.ipAddress ?? null,
    deviceLabel: session.deviceLabel ?? null,
    expiresAt: session.expiresAt.toISOString(),
    lastUsedAt: session.lastUsedAt.toISOString(),
    lastRotatedAt: session.lastRotatedAt.toISOString(),
    rotatedFromId: session.rotatedFromId ? session.rotatedFromId.toString() : null,
    revokedAt: session.revokedAt ? session.revokedAt.toISOString() : null,
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
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    passwordChangedAt: user.passwordChangedAt ? user.passwordChangedAt.toISOString() : null,
    failedLoginCount: user.failedLoginCount ?? 0,
    lockedUntil: user.lockedUntil ? user.lockedUntil.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

export async function createSession(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  session: SessionDeviceInfo;
  rotatedFromId?: string | null;
}) {
  await connectToDatabase();
  const created = await AuthSessionModel.create({
    userId: data.userId,
    tokenHash: data.tokenHash,
    expiresAt: data.expiresAt,
    userAgent: data.session.userAgent ?? null,
    ipAddress: data.session.ipAddress ?? null,
    deviceLabel: data.session.deviceLabel ?? null,
    rotatedFromId: data.rotatedFromId ?? null,
    lastUsedAt: new Date(),
    lastRotatedAt: new Date()
  });

  return toSessionRecord(created.toObject<LeanSession>());
}

export async function getSessionWithUserByTokenHash(tokenHash: string) {
  await connectToDatabase();

  const sessions = await AuthSessionModel.aggregate<LeanSessionWithUser>([
    {
      $match: {
        tokenHash,
        revokedAt: null,
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
  const updated = await AuthSessionModel.findOneAndUpdate(
    {
      tokenHash,
      revokedAt: null
    },
    {
      $set: {
        lastUsedAt: new Date()
      }
    },
    {
      new: true
    }
  ).lean<LeanSession | null>();

  return toSessionRecord(updated);
}

export async function updateSessionRotation(
  currentSessionId: string,
  nextTokenHash: string,
  expiresAt: Date
) {
  await connectToDatabase();
  const updated = await AuthSessionModel.findOneAndUpdate(
    {
      _id: currentSessionId,
      revokedAt: null
    },
    {
      $set: {
        tokenHash: nextTokenHash,
        expiresAt,
        lastRotatedAt: new Date(),
        lastUsedAt: new Date()
      }
    },
    {
      new: true
    }
  ).lean<LeanSession | null>();

  return toSessionRecord(updated);
}

export async function revokeSessionByTokenHash(tokenHash: string) {
  await connectToDatabase();
  await AuthSessionModel.updateOne(
    {
      tokenHash,
      revokedAt: null
    },
    {
      $set: {
        revokedAt: new Date()
      }
    }
  );
}

export async function deleteSessionByTokenHash(tokenHash: string) {
  await revokeSessionByTokenHash(tokenHash);
}

export async function listActiveSessionsForUser(userId: string) {
  await connectToDatabase();
  const sessions = await AuthSessionModel.find({
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  })
    .sort({ lastUsedAt: -1 })
    .lean<LeanSession[]>();

  return sessions
    .map((session) => toSessionRecord(session))
    .filter((session): session is AuthSessionRecord => Boolean(session));
}

export async function revokeSessionById(userId: string, sessionId: string) {
  await connectToDatabase();
  const updated = await AuthSessionModel.findOneAndUpdate(
    {
      _id: sessionId,
      userId,
      revokedAt: null
    },
    {
      $set: {
        revokedAt: new Date()
      }
    },
    {
      new: true
    }
  ).lean<LeanSession | null>();

  return toSessionRecord(updated);
}

export async function revokeOtherSessions(userId: string, excludeSessionId: string | null) {
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    userId,
    revokedAt: null
  };

  if (excludeSessionId) {
    filter._id = {
      $ne: excludeSessionId
    };
  }

  await AuthSessionModel.updateMany(filter, {
    $set: {
      revokedAt: new Date()
    }
  });
}

export async function revokeSessionsForUser(userId: string) {
  await connectToDatabase();
  await AuthSessionModel.updateMany(
    {
      userId,
      revokedAt: null
    },
    {
      $set: {
        revokedAt: new Date()
      }
    }
  );
}
