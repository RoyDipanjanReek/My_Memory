import { requireSessionFromRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-response";
import { incrementMetric } from "@/lib/metrics";
import { getRequestContext } from "@/lib/security";
import { listUserSessions } from "@/services/auth.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = getRequestContext(request);
  const auth = await requireSessionFromRequest(request);
  const sessions = await listUserSessions(auth.user);
  incrementMetric("auth.sessions.list");

  return jsonResponse(
    {
      data: {
        sessions,
        currentSessionId: auth.session.id
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
