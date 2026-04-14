import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { buildRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { logEvent } from "@/lib/logger";
import { exportTemplateCatalog } from "@/services/template.service";
import { toErrorResponse } from "@/utils/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "MONGODB_URI is not configured." },
      { status: 503 }
    );
  }

  let ownerId = "unknown";

  try {
    const user = await requireUserFromRequest(request);
    ownerId = user.id;
    const limitCheck = checkRateLimit(`${user.id}:templates:export`, 15, 60_000);

    if (!limitCheck.ok) {
      return NextResponse.json(
        { error: "Export rate limit exceeded. Please retry shortly." },
        { status: 429, headers: buildRateLimitHeaders(limitCheck) }
      );
    }

    const payload = await exportTemplateCatalog(user.id);

    return NextResponse.json(payload, {
      headers: {
        "Content-Disposition": `attachment; filename="developer-memory-export.json"`,
        ...Object.fromEntries(buildRateLimitHeaders(limitCheck).entries())
      }
    });
  } catch (error) {
    logEvent("error", "Failed to export templates", {
      ownerId,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(toErrorResponse(error, "Failed to export templates."), {
      status: error instanceof AuthenticationError ? error.statusCode : 500
    });
  }
}
import { AuthenticationError } from "@/services/auth.service";
