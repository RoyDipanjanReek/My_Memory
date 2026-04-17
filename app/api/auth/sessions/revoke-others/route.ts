import { requireSessionFromRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-response";
import { incrementMetric } from "@/lib/metrics";
import { ensureSameOriginRequest, getRequestContext } from "@/lib/security";
import { revokeOtherUserSessions } from "@/services/auth.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = getRequestContext(request);
  ensureSameOriginRequest(request);
  const auth = await requireSessionFromRequest(request);
  await revokeOtherUserSessions(auth.user, auth.session.id, context);
  incrementMetric("auth.sessions.revoke_others");

  return jsonResponse(
    {
      data: {
        success: true
      }
    },
    {
      context,
      rotatedSession:
        auth.rotatedToken && auth.expiresAt
          ? { token: auth.rotatedToken, expiresAt: auth.expiresAt }
          : null
    }
  );
}
