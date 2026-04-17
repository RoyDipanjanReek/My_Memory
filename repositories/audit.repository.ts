import { connectToDatabase } from "@/lib/mongodb";
import AuditEventModel from "@/models/AuditEvent";
import type { AuditEventRecord } from "@/types/observability.types";

type LeanAuditEvent = {
  _id: { toString(): string };
  actorId: string | null;
  ownerId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  requestId: string | null;
  status: "success" | "failure";
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toAuditEventRecord(event: LeanAuditEvent | null): AuditEventRecord | null {
  if (!event) {
    return null;
  }

  return {
    id: event._id.toString(),
    actorId: event.actorId,
    ownerId: event.ownerId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    requestId: event.requestId,
    status: event.status,
    metadata: event.metadata ?? {},
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    createdAt: event.createdAt.toISOString()
  };
}

export async function createAuditEvent(data: Omit<AuditEventRecord, "id" | "createdAt">) {
  await connectToDatabase();
  const created = await AuditEventModel.create(data);
  return toAuditEventRecord(created.toObject<LeanAuditEvent>());
}
