import { requireSessionFromRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-response";
import { incrementMetric } from "@/lib/metrics";
import { buildRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { ensureSameOriginRequest, getRequestContext } from "@/lib/security";
import { requestEmailVerification } from "@/services/auth.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = getRequestContext(request);
  ensureSameOriginRequest(request);
  const auth = await requireSessionFromRequest(request);
  const limitCheck = checkRateLimit(`${auth.user.id}:verify-email:request`, 6, 60_000);

  if (!limitCheck.ok) {
    return jsonResponse(
      { error: "Too many verification requests. Please retry shortly." },
      {
        status: 429,
        headers: buildRateLimitHeaders(limitCheck),
        context,
        rotatedSession:
          auth.rotatedToken && auth.expiresAt
            ? { token: auth.rotatedToken, expiresAt: auth.expiresAt }
            : null
      }
    );
  }

  const result = await requestEmailVerification(auth.user, context);
  incrementMetric("auth.verify_email.request");

  return jsonResponse(
    {
      data: {
        success: true
      },
      meta: {
        verificationToken: result.token
      }
    },
    {
      headers: buildRateLimitHeaders(limitCheck),
      context,
      rotatedSession:
        auth.rotatedToken && auth.expiresAt
          ? { token: auth.rotatedToken, expiresAt: auth.expiresAt }
          : null
    }
  );
}
