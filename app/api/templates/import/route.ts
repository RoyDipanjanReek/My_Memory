import { requireSessionFromRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-response";
import { runIdempotentJsonMutation } from "@/lib/idempotency";
import { incrementMetric } from "@/lib/metrics";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { buildRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { ensureSameOriginRequest, getRequestContext, hashRequestBody } from "@/lib/security";
import { logEvent } from "@/lib/logger";
import { AuthenticationError } from "@/services/auth.service";
import { ValidationError, importTemplateCatalog } from "@/services/template.service";
import { toErrorResponse } from "@/utils/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = getRequestContext(request);

  if (!isDatabaseConfigured()) {
    return jsonResponse({ error: "MONGODB_URI is not configured." }, { status: 503, context });
  }

  let ownerId = "unknown";

  try {
    ensureSameOriginRequest(request);
    const auth = await requireSessionFromRequest(request);
    const { user, rotatedToken, expiresAt } = auth;
    ownerId = user.id;
    const limitCheck = checkRateLimit(`${user.id}:templates:import`, 8, 60_000);

    if (!limitCheck.ok) {
      incrementMetric("templates.import.rate_limited");
      return jsonResponse(
        { error: "Import rate limit exceeded. Please retry shortly." },
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
        const imported = await importTemplateCatalog(user, body, context);
        incrementMetric("templates.import.success");
        return {
          body: imported,
          status: 201,
          headers: buildRateLimitHeaders(limitCheck)
        };
      }
    );
  } catch (error) {
    incrementMetric("templates.import.error");
    logEvent("error", "Failed to import templates", {
      ownerId,
      requestId: context.requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonResponse(toErrorResponse(error, "Failed to import templates."), {
      status:
        error instanceof ValidationError || error instanceof AuthenticationError
          ? error.statusCode
          : 500,
      context
    });
  }
}
