import { clearSessionCookie, getSessionTokenFromRequest, requireSessionFromRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-response";
import { incrementMetric } from "@/lib/metrics";
import { buildRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { ensureSameOriginRequest, getRequestContext } from "@/lib/security";
import { logEvent } from "@/lib/logger";
import { logoutUser } from "@/services/auth.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = getRequestContext(request);
  const sessionToken = getSessionTokenFromRequest(request);

  try {
    ensureSameOriginRequest(request);
    const auth = await requireSessionFromRequest(request);
    const limitCheck = checkRateLimit(`auth:logout:${auth.user.id}`, 20, 60_000);

    if (!limitCheck.ok) {
      incrementMetric("auth.logout.rate_limited");
      return jsonResponse(
        { error: "Too many logout attempts. Please retry shortly." },
        { status: 429, headers: buildRateLimitHeaders(limitCheck), context }
      );
    }

    await logoutUser(sessionToken, auth.user, context);
    incrementMetric("auth.logout.success");

    const response = jsonResponse(
      { data: { success: true } },
      {
        headers: buildRateLimitHeaders(limitCheck),
        context
      }
    );
    clearSessionCookie(response);
    return response;
  } catch (error) {
    incrementMetric("auth.logout.error");
    logEvent("error", "Failed to log out user", {
      requestId: context.requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    const response = jsonResponse(
      { error: "Failed to sign out." },
      { status: 500, context }
    );
    clearSessionCookie(response);
    return response;
  }
}
