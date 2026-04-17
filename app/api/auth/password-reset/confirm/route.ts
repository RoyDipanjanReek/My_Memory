import { getSessionDeviceInfo } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-response";
import { incrementMetric } from "@/lib/metrics";
import { buildRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { ensureSameOriginRequest, getRequestContext } from "@/lib/security";
import {
  AuthValidationError,
  resetPasswordWithToken
} from "@/services/auth.service";
import { toErrorResponse } from "@/utils/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = getRequestContext(request);

  try {
    ensureSameOriginRequest(request);
    const limitCheck = checkRateLimit(`password-reset-confirm:${context.ipAddress ?? "unknown"}`, 10, 60_000);

    if (!limitCheck.ok) {
      return jsonResponse(
        { error: "Too many reset attempts. Please retry shortly." },
        { status: 429, headers: buildRateLimitHeaders(limitCheck), context }
      );
    }

    const body = await request.json();
    const result = await resetPasswordWithToken(body, getSessionDeviceInfo(request), context);
    incrementMetric("auth.password_reset.confirm");

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
    return jsonResponse(toErrorResponse(error, "Failed to reset password."), {
      status: error instanceof AuthValidationError ? error.statusCode : 500,
      context
    });
  }
}
