import { connectToDatabase } from "@/lib/mongodb";
import IdempotencyKeyModel from "@/models/IdempotencyKey";

type LeanIdempotencyKey = {
  _id: { toString(): string };
  ownerId: string | null;
  key: string;
  method: string;
  path: string;
  requestHash: string;
  statusCode: number | null;
  responseBody: string | null;
  completedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type IdempotencyRecord = {
  id: string;
  ownerId: string | null;
  key: string;
  method: string;
  path: string;
  requestHash: string;
  statusCode: number | null;
  responseBody: string | null;
  completedAt: string | null;
  expiresAt: string;
};

function toIdempotencyRecord(record: LeanIdempotencyKey | null): IdempotencyRecord | null {
  if (!record) {
    return null;
  }

  return {
    id: record._id.toString(),
    ownerId: record.ownerId,
    key: record.key,
    method: record.method,
    path: record.path,
    requestHash: record.requestHash,
    statusCode: record.statusCode,
    responseBody: record.responseBody,
    completedAt: record.completedAt ? record.completedAt.toISOString() : null,
    expiresAt: record.expiresAt.toISOString()
  };
}

export async function getIdempotencyRecord(data: {
  ownerId: string | null;
  key: string;
  method: string;
  path: string;
}) {
  await connectToDatabase();
  const record = await IdempotencyKeyModel.findOne(data).lean<LeanIdempotencyKey | null>();
  return toIdempotencyRecord(record);
}

export async function reserveIdempotencyRecord(data: {
  ownerId: string | null;
  key: string;
  method: string;
  path: string;
  requestHash: string;
  expiresAt: Date;
}) {
  await connectToDatabase();

  try {
    const created = await IdempotencyKeyModel.create(data);
    return toIdempotencyRecord(created.toObject<LeanIdempotencyKey>());
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code?: number }).code === 11000) {
      return null;
    }

    throw error;
  }
}

export async function completeIdempotencyRecord(
  id: string,
  data: {
    statusCode: number;
    responseBody: string;
  }
) {
  await connectToDatabase();
  const updated = await IdempotencyKeyModel.findByIdAndUpdate(
    id,
    {
      $set: {
        statusCode: data.statusCode,
        responseBody: data.responseBody,
        completedAt: new Date()
      }
    },
    {
      new: true
    }
  ).lean<LeanIdempotencyKey | null>();

  return toIdempotencyRecord(updated);
}
