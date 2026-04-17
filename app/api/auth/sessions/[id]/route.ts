import { requireSessionFromRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-response";
import { incrementMetric } from "@/lib/metrics";
import { ensureSameOriginRequest, getRequestContext } from "@/lib/security";
import { revokeSessionForActor } from "@/services/auth.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const context = getRequestContext(request);
  ensureSameOriginRequest(request);
  const auth = await requireSessionFromRequest(request);
  const session = await revokeSessionForActor(auth.user, params.id, undefined, context);
  incrementMetric("auth.sessions.revoke_one");

  return jsonResponse(
    {
      data: session
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
