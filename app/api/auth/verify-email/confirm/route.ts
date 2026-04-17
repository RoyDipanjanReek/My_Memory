import { jsonResponse } from "@/lib/api-response";
import { incrementMetric } from "@/lib/metrics";
import { buildRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { ensureSameOriginRequest, getRequestContext } from "@/lib/security";
import { AuthValidationError, verifyEmailToken } from "@/services/auth.service";
import { toErrorResponse } from "@/utils/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = getRequestContext(request);

  try {
    ensureSameOriginRequest(request);
    const limitCheck = checkRateLimit(`verify-email:${context.ipAddress ?? "unknown"}`, 12, 60_000);

    if (!limitCheck.ok) {
      return jsonResponse(
        { error: "Too many verification attempts. Please retry shortly." },
        { status: 429, headers: buildRateLimitHeaders(limitCheck), context }
      );
    }

    const body = await request.json();
    const user = await verifyEmailToken(body, context);
    incrementMetric("auth.verify_email.confirm");

    return jsonResponse(
      { data: user },
      { headers: buildRateLimitHeaders(limitCheck), context }
    );
  } catch (error) {
    return jsonResponse(toErrorResponse(error, "Failed to verify email."), {
      status: error instanceof AuthValidationError ? error.statusCode : 500,
      context
    });
  }
}
