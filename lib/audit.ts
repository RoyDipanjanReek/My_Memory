import { createAuditEvent } from "@/repositories/audit.repository";
import { logEvent } from "@/lib/logger";
import { incrementMetric } from "@/lib/metrics";
import type { RequestContext } from "@/types/observability.types";

type AuditInput = {
  actorId?: string | null;
  ownerId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  status: "success" | "failure";
  metadata?: Record<string, unknown>;
  context?: RequestContext | null;
};

export async function recordAuditEvent(input: AuditInput) {
  try {
    incrementMetric(`audit.${input.action}.${input.status}`);

    await createAuditEvent({
      actorId: input.actorId ?? null,
      ownerId: input.ownerId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      requestId: input.context?.requestId ?? null,
      status: input.status,
      metadata: input.metadata ?? {},
      ipAddress: input.context?.ipAddress ?? null,
      userAgent: input.context?.userAgent ?? null
    });
  } catch (error) {
    logEvent("error", "Failed to persist audit event", {
      action: input.action,
      entityType: input.entityType,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
