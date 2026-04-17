export interface RequestContext {
  requestId: string;
  method: string;
  path: string;
  origin: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuditEventRecord {
  id: string;
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
  createdAt: string;
}
