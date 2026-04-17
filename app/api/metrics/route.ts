import { requireSessionFromRequest } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-response";
import { getMetricsSnapshot } from "@/lib/metrics";
import { getRequestContext } from "@/lib/security";
import { assertAuthorizedRole } from "@/services/auth.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = getRequestContext(request);
  const auth = await requireSessionFromRequest(request);
  assertAuthorizedRole(auth.user, ["admin"]);

  return jsonResponse(
    { data: getMetricsSnapshot() },
    {
      context,
      rotatedSession:
        auth.rotatedToken && auth.expiresAt
          ? { token: auth.rotatedToken, expiresAt: auth.expiresAt }
          : null
    }
  );
}
