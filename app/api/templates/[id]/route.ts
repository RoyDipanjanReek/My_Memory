import { NextResponse } from "next/server";
import { requireSessionFromRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-response";
import { runIdempotentJsonMutation } from "@/lib/idempotency";
import { incrementMetric } from "@/lib/metrics";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { buildRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { ensureSameOriginRequest, getRequestContext, hashRequestBody } from "@/lib/security";
import { logEvent } from "@/lib/logger";
import { AuthenticationError } from "@/services/auth.service";
import {
  NotFoundError,
  ValidationError,
  deleteTemplate,
  getTemplate,
  updateTemplate
} from "@/services/template.service";
import { toErrorResponse } from "@/utils/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ensureConfigured(context: ReturnType<typeof getRequestContext>) {
  if (!isDatabaseConfigured()) {
    return jsonResponse({ error: "MONGODB_URI is not configured." }, { status: 503, context });
  }

  return null;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const context = getRequestContext(request);
  const configuredResponse = ensureConfigured(context);
  if (configuredResponse) {
    return configuredResponse;
  }

  let ownerId = "unknown";

  try {
    const auth = await requireSessionFromRequest(request);
    const { user, rotatedToken, expiresAt } = auth;
    ownerId = user.id;
    const template = await getTemplate(user, params.id, context);
    incrementMetric("template.read.success");
    return jsonResponse({ data: template }, {
      context,
      rotatedSession: rotatedToken ? { token: rotatedToken, expiresAt } : null
    });
  } catch (error) {
    incrementMetric("template.read.error");
    logEvent("error", "Failed to load template", {
      ownerId,
      templateId: params.id,
      requestId: context.requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonResponse(toErrorResponse(error, "Failed to load template."), {
      status:
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof AuthenticationError
          ? error.statusCode
          : 500,
      context
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const context = getRequestContext(request);
  const configuredResponse = ensureConfigured(context);
  if (configuredResponse) {
    return configuredResponse;
  }

  let ownerId = "unknown";

  try {
    ensureSameOriginRequest(request);
    const auth = await requireSessionFromRequest(request);
    const { user, rotatedToken, expiresAt } = auth;
    ownerId = user.id;
    const limitCheck = checkRateLimit(`${user.id}:templates:delete`, 20, 60_000);

    if (!limitCheck.ok) {
      incrementMetric("template.delete.rate_limited");
      return jsonResponse(
        { error: "Delete rate limit exceeded. Please retry shortly." },
        {
          status: 429,
          headers: buildRateLimitHeaders(limitCheck),
          context,
          rotatedSession: rotatedToken ? { token: rotatedToken, expiresAt } : null
        }
      );
    }

    const body = { id: params.id };
    return runIdempotentJsonMutation(
      {
        ownerId: user.id,
        method: request.method,
        path: context.path,
        key: request.headers.get("idempotency-key"),
        requestHash: hashRequestBody(body),
        context,
        rotatedSession: rotatedToken ? { token: rotatedToken, expiresAt } : null
      },
      async () => {
        const deleted = await deleteTemplate(user, params.id, context);
        incrementMetric("template.delete.success");
        return {
          body: { data: deleted },
          headers: buildRateLimitHeaders(limitCheck)
        };
      }
    );
  } catch (error) {
    incrementMetric("template.delete.error");
    logEvent("error", "Failed to delete template", {
      ownerId,
      templateId: params.id,
      requestId: context.requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonResponse(toErrorResponse(error, "Failed to delete template."), {
      status:
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof AuthenticationError
          ? error.statusCode
          : 500,
      context
    });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const context = getRequestContext(request);
  const configuredResponse = ensureConfigured(context);
  if (configuredResponse) {
    return configuredResponse;
  }

  let ownerId = "unknown";

  try {
    ensureSameOriginRequest(request);
    const auth = await requireSessionFromRequest(request);
    const { user, rotatedToken, expiresAt } = auth;
    ownerId = user.id;
    const limitCheck = checkRateLimit(`${user.id}:templates:patch`, 40, 60_000);

    if (!limitCheck.ok) {
      incrementMetric("template.patch.rate_limited");
      return jsonResponse(
        { error: "Update rate limit exceeded. Please retry shortly." },
        {
          status: 429,
          headers: buildRateLimitHeaders(limitCheck),
          context,
          rotatedSession: rotatedToken ? { token: rotatedToken, expiresAt } : null
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    return runIdempotentJsonMutation(
      {
        ownerId: user.id,
        method: request.method,
        path: context.path,
        key: request.headers.get("idempotency-key"),
        requestHash: hashRequestBody(body),
        context,
        rotatedSession: rotatedToken ? { token: rotatedToken, expiresAt } : null
      },
      async () => {
        const updated = await updateTemplate(user, params.id, body, context);
        incrementMetric("template.patch.success");
        return {
          body: { data: updated },
          headers: buildRateLimitHeaders(limitCheck)
        };
      }
    );
  } catch (error) {
    incrementMetric("template.patch.error");
    logEvent("error", "Failed to update template", {
      ownerId,
      templateId: params.id,
      requestId: context.requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonResponse(toErrorResponse(error, "Failed to update template."), {
      status:
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof AuthenticationError
          ? error.statusCode
          : 500,
      context
    });
  }
}
