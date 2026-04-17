import { requireSessionFromRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-response";
import { incrementMetric } from "@/lib/metrics";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { buildRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { getRequestContext } from "@/lib/security";
import { logEvent } from "@/lib/logger";
import { AuthenticationError } from "@/services/auth.service";
import { exportTemplateCatalog } from "@/services/template.service";
import { toErrorResponse } from "@/utils/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = getRequestContext(request);

  if (!isDatabaseConfigured()) {
    return jsonResponse({ error: "MONGODB_URI is not configured." }, { status: 503, context });
  }

  let ownerId = "unknown";

  try {
    const auth = await requireSessionFromRequest(request);
    const { user, rotatedToken, expiresAt } = auth;
    ownerId = user.id;
    const limitCheck = checkRateLimit(`${user.id}:templates:export`, 15, 60_000);

    if (!limitCheck.ok) {
      incrementMetric("templates.export.rate_limited");
      return jsonResponse(
        { error: "Export rate limit exceeded. Please retry shortly." },
        {
          status: 429,
          headers: buildRateLimitHeaders(limitCheck),
          context,
          rotatedSession: rotatedToken ? { token: rotatedToken, expiresAt } : null
        }
      );
    }

    const payload = await exportTemplateCatalog(user, context);
    incrementMetric("templates.export.success");

    return jsonResponse(payload, {
      headers: {
        "Content-Disposition": `attachment; filename="developer-memory-export.json"`,
        ...Object.fromEntries(buildRateLimitHeaders(limitCheck).entries())
      },
      context,
      rotatedSession: rotatedToken ? { token: rotatedToken, expiresAt } : null
    });
  } catch (error) {
    incrementMetric("templates.export.error");
    logEvent("error", "Failed to export templates", {
      ownerId,
      requestId: context.requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonResponse(toErrorResponse(error, "Failed to export templates."), {
      status: error instanceof AuthenticationError ? error.statusCode : 500,
      context
    });
  }
}
