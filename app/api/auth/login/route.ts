import { getSessionDeviceInfo } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-response";
import { incrementMetric } from "@/lib/metrics";
import { buildRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { ensureSameOriginRequest, getRequestContext } from "@/lib/security";
import { logEvent } from "@/lib/logger";
import {
  AuthenticationError,
  AuthValidationError,
  loginUser
} from "@/services/auth.service";
import { toErrorResponse } from "@/utils/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = getRequestContext(request);

  try {
    ensureSameOriginRequest(request);
    const limitCheck = checkRateLimit(`auth:login:${context.ipAddress ?? "unknown"}`, 12, 60_000);

    if (!limitCheck.ok) {
      incrementMetric("auth.login.rate_limited");
      return jsonResponse(
        { error: "Too many login attempts. Please retry shortly." },
        { status: 429, headers: buildRateLimitHeaders(limitCheck), context }
      );
    }

    const body = await request.json();
    const result = await loginUser(body, getSessionDeviceInfo(request), context);
    incrementMetric("auth.login.success");

    return jsonResponse(
      { data: result.user },
      {
        headers: buildRateLimitHeaders(limitCheck),
        context,
        rotatedSession: {
          token: result.sessionToken,
          expiresAt: result.expiresAt
        }
      }
    );
  } catch (error) {
    incrementMetric("auth.login.error");
    logEvent("error", "Failed to log in user", {
      requestId: context.requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonResponse(toErrorResponse(error, "Failed to sign in."), {
      status:
        error instanceof AuthValidationError || error instanceof AuthenticationError
          ? error.statusCode
          : 500,
      context
    });
  }
}
