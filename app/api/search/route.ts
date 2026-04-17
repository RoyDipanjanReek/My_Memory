import { requireSessionFromRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-response";
import { incrementMetric } from "@/lib/metrics";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { buildRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { getRequestContext } from "@/lib/security";
import { templateQuerySchema } from "@/lib/validation";
import { logEvent } from "@/lib/logger";
import { AuthenticationError } from "@/services/auth.service";
import { ValidationError, searchTemplateCatalog } from "@/services/template.service";
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
    const limitCheck = checkRateLimit(`${user.id}:search:read`, 120, 60_000);

    if (!limitCheck.ok) {
      incrementMetric("search.read.rate_limited");
      return jsonResponse(
        { error: "Search rate limit exceeded. Please retry shortly." },
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
    const templates = await searchTemplateCatalog(
      user,
      {
        query: parsedQuery.q ?? "",
        category: parsedQuery.category ?? "all",
        tag: parsedQuery.tag ?? "all",
        collection: parsedQuery.collection ?? "all",
        view: parsedQuery.view ?? "all",
        includeArchived: parsedQuery.archived === "true",
        limit: parsedQuery.limit ?? 24,
        cursor: parsedQuery.cursor ?? null
      },
      context
    );

    incrementMetric("search.read.success");
    return jsonResponse(templates, {
      headers: buildRateLimitHeaders(limitCheck),
      context,
      rotatedSession: rotatedToken ? { token: rotatedToken, expiresAt } : null
    });
  } catch (error) {
    incrementMetric("search.read.error");
    logEvent("error", "Failed to search templates", {
      ownerId,
      requestId: context.requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonResponse(toErrorResponse(error, "Failed to search templates."), {
      status:
        error instanceof ValidationError || error instanceof AuthenticationError
          ? error.statusCode
          : 500,
      context
    });
  }
}
