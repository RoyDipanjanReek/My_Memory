// Template Import API Route
// POST /api/templates/import - Imports templates from JSON
// Allows users to restore templates or bulk import

import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { buildRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { logEvent } from "@/lib/logger";
import { AuthenticationError } from "@/services/auth.service";
import {
  ValidationError,
  importTemplateCatalog
} from "@/services/template.service";
import { toErrorResponse } from "@/utils/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
    const limitCheck = checkRateLimit(`${user.id}:templates:import`, 8, 60_000);

    if (!limitCheck.ok) {
      return NextResponse.json(
        { error: "Import rate limit exceeded. Please retry shortly." },
        { status: 429, headers: buildRateLimitHeaders(limitCheck) }
      );
    }

    const body = await request.json();
    const imported = await importTemplateCatalog(user.id, body);

    return NextResponse.json(imported, {
      status: 201,
      headers: buildRateLimitHeaders(limitCheck)
    });
  } catch (error) {
    const status =
      error instanceof ValidationError || error instanceof AuthenticationError
        ? error.statusCode
        : 500;

    logEvent("error", "Failed to import templates", {
      ownerId,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(toErrorResponse(error, "Failed to import templates."), {
      status
    });
  }
}
