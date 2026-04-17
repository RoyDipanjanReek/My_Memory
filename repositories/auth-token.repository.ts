import { connectToDatabase } from "@/lib/mongodb";
import AuthTokenModel from "@/models/AuthToken";
import type { AuthTokenRecord, AuthTokenType } from "@/types/auth.types";

type LeanAuthToken = {
  _id: { toString(): string };
  userId: { toString(): string };
  tokenHash: string;
  type: AuthTokenType;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toAuthTokenRecord(token: LeanAuthToken | null): AuthTokenRecord | null {
  if (!token) {
    return null;
  }

  return {
    id: token._id.toString(),
    userId: token.userId.toString(),
    tokenHash: token.tokenHash,
    type: token.type,
    expiresAt: token.expiresAt.toISOString(),
    consumedAt: token.consumedAt ? token.consumedAt.toISOString() : null,
    createdAt: token.createdAt.toISOString(),
    updatedAt: token.updatedAt.toISOString()
  };
}

export async function createAuthToken(data: {
  userId: string;
  tokenHash: string;
  type: AuthTokenType;
  expiresAt: Date;
}) {
  await connectToDatabase();
  const created = await AuthTokenModel.create(data);
  return toAuthTokenRecord(created.toObject<LeanAuthToken>());
}

export async function getValidAuthTokenByHash(tokenHash: string, type: AuthTokenType) {
  await connectToDatabase();
  const token = await AuthTokenModel.findOne({
    tokenHash,
    type,
    consumedAt: null,
    expiresAt: { $gt: new Date() }
  }).lean<LeanAuthToken | null>();

  return toAuthTokenRecord(token);
}

export async function consumeAuthToken(id: string) {
  await connectToDatabase();
  const updated = await AuthTokenModel.findByIdAndUpdate(
    id,
    {
      $set: {
        consumedAt: new Date()
      }
    },
    {
      new: true
    }
  ).lean<LeanAuthToken | null>();

  return toAuthTokenRecord(updated);
}

export async function deleteActiveTokensForUser(userId: string, type?: AuthTokenType) {
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    userId,
    consumedAt: null
  };

  if (type) {
    filter.type = type;
  }

  await AuthTokenModel.deleteMany(filter);
}
