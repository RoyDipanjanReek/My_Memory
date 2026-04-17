import { jsonResponse } from "@/lib/api-response";
import { incrementMetric } from "@/lib/metrics";
import { buildRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { ensureSameOriginRequest, getRequestContext } from "@/lib/security";
import { requestPasswordReset } from "@/services/auth.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = getRequestContext(request);
  ensureSameOriginRequest(request);
  const limitCheck = checkRateLimit(`password-reset:${context.ipAddress ?? "unknown"}`, 6, 60_000);

  if (!limitCheck.ok) {
    return jsonResponse(
      { error: "Too many reset requests. Please retry shortly." },
      { status: 429, headers: buildRateLimitHeaders(limitCheck), context }
    );
  }

  const body = await request.json();
  const result = await requestPasswordReset(body, context);
  incrementMetric("auth.password_reset.request");

  return jsonResponse(
    {
      data: {
        success: true
      },
      meta: {
        resetToken: result.token
      }
    },
    { headers: buildRateLimitHeaders(limitCheck), context }
  );
}
