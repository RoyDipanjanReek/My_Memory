import { NextResponse } from "next/server";
import { getSessionTokenFromRequest, requireSessionFromRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-response";
import { runIdempotentJsonMutation } from "@/lib/idempotency";
import { incrementMetric } from "@/lib/metrics";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { buildRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { getRequestContext, hashRequestBody, ensureSameOriginRequest } from "@/lib/security";
import { templateQuerySchema } from "@/lib/validation";
import { logEvent } from "@/lib/logger";
import { AuthenticationError } from "@/services/auth.service";
import {
  ValidationError,
  createTemplate,
  getTemplates,
  runBulkTemplateAction
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

export async function GET(request: Request) {
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
    const limitCheck = checkRateLimit(`${user.id}:templates:read`, 90, 60_000);

    if (!limitCheck.ok) {
      incrementMetric("templates.read.rate_limited");
      return jsonResponse(
        { error: "Too many requests. Please retry shortly." },
        {
          status: 429,
          headers: buildRateLimitHeaders(limitCheck),
          context,
          rotatedSession: rotatedToken ? { token: rotatedToken, expiresAt } : null
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = templateQuerySchema.parse(Object.fromEntries(searchParams.entries()));
    const templates = await getTemplates(
      user,
      {
        query: parsedQuery.q ?? "",
        category: parsedQuery.category ?? "all",
        tag: parsedQuery.tag ?? "",
        collection: parsedQuery.collection ?? "",
        view: parsedQuery.view ?? "all",
        includeArchived: parsedQuery.archived === "true",
        limit: parsedQuery.limit ?? 24,
        cursor: parsedQuery.cursor ?? null
      },
      context
    );

    incrementMetric("templates.read.success");
    return jsonResponse(templates, {
      headers: buildRateLimitHeaders(limitCheck),
      context,
      rotatedSession: rotatedToken ? { token: rotatedToken, expiresAt } : null
    });
  } catch (error) {
    incrementMetric("templates.read.error");
    logEvent("error", "Failed to load templates", {
      ownerId,
      requestId: context.requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonResponse(toErrorResponse(error, "Failed to load templates."), {
      status:
        error instanceof AuthenticationError || error instanceof ValidationError
          ? error.statusCode
          : 500,
      context
    });
  }
}

export async function POST(request: Request) {
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
    const limitCheck = checkRateLimit(`${user.id}:templates:write`, 30, 60_000);

    if (!limitCheck.ok) {
      incrementMetric("templates.write.rate_limited");
      return jsonResponse(
        { error: "Write rate limit exceeded. Please retry shortly." },
        {
          status: 429,
          headers: buildRateLimitHeaders(limitCheck),
          context,
          rotatedSession: rotatedToken ? { token: rotatedToken, expiresAt } : null
        }
      );
    }

    const body = await request.json();
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
        const result = await createTemplate(user, body, context);
        incrementMetric("templates.write.success");
        return {
          body: {
            data: result.template,
            meta: {
              duplicate: result.duplicate
            }
          },
          status: result.duplicate ? 200 : 201,
          headers: buildRateLimitHeaders(limitCheck)
        };
      }
    );
  } catch (error) {
    incrementMetric("templates.write.error");
    logEvent("error", "Failed to create template", {
      ownerId,
      requestId: context.requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonResponse(toErrorResponse(error, "Failed to create template."), {
      status:
        error instanceof ValidationError || error instanceof AuthenticationError
          ? error.statusCode
          : 500,
      context
    });
  }
}

export async function PATCH(request: Request) {
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
    const limitCheck = checkRateLimit(`${user.id}:templates:bulk`, 20, 60_000);

    if (!limitCheck.ok) {
      incrementMetric("templates.bulk.rate_limited");
      return jsonResponse(
        { error: "Bulk action rate limit exceeded. Please retry shortly." },
        {
          status: 429,
          headers: buildRateLimitHeaders(limitCheck),
          context,
          rotatedSession: rotatedToken ? { token: rotatedToken, expiresAt } : null
        }
      );
    }

    const body = await request.json();
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
        const templates = await runBulkTemplateAction(user, body, context);
        incrementMetric("templates.bulk.success");
        return {
          body: { data: templates },
          headers: buildRateLimitHeaders(limitCheck)
        };
      }
    );
  } catch (error) {
    incrementMetric("templates.bulk.error");
    logEvent("error", "Failed to run bulk template action", {
      ownerId,
      requestId: context.requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonResponse(toErrorResponse(error, "Failed to update templates."), {
      status:
        error instanceof ValidationError || error instanceof AuthenticationError
          ? error.statusCode
          : 500,
      context
    });
  }
}
