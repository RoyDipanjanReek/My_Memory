import { getSessionTokenFromRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-response";
import { incrementMetric } from "@/lib/metrics";
import { getRequestContext } from "@/lib/security";
import { getAuthenticatedSession } from "@/services/auth.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = getRequestContext(request);
  const sessionToken = getSessionTokenFromRequest(request);
  const session = await getAuthenticatedSession(sessionToken, context);

  incrementMetric("auth.session.read");

  return jsonResponse(
    {
      data: {
        user: session?.user ?? null,
        session: session?.session ?? null
      }
    },
    {
      context,
      rotatedSession:
        session?.rotatedToken && session.expiresAt
          ? { token: session.rotatedToken, expiresAt: session.expiresAt }
          : null
    }
  );
}
