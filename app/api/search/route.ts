import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { buildRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { logEvent } from "@/lib/logger";
import { AuthenticationError } from "@/services/auth.service";
import {
  ValidationError,
  searchTemplateCatalog
} from "@/services/template.service";
import type { TemplateFilters } from "@/types/template.types";
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
    const limitCheck = checkRateLimit(`${user.id}:search:read`, 120, 60_000);

    if (!limitCheck.ok) {
      return NextResponse.json(
        { error: "Search rate limit exceeded. Please retry shortly." },
        { status: 429, headers: buildRateLimitHeaders(limitCheck) }
      );
    }

    const { searchParams } = new URL(request.url);
    const templates = await searchTemplateCatalog(user.id, {
      query: searchParams.get("q") ?? "",
      category: (searchParams.get("category") ?? "all") as TemplateFilters["category"],
      tag: searchParams.get("tag") ?? "all",
      collection: searchParams.get("collection") ?? "all",
      view: (searchParams.get("view") ?? "all") as TemplateFilters["view"],
      includeArchived: searchParams.get("archived") === "true",
      limit: Number(searchParams.get("limit") ?? 24),
      cursor: searchParams.get("cursor")
    });

    return NextResponse.json(templates, {
      headers: buildRateLimitHeaders(limitCheck)
    });
  } catch (error) {
    const status =
      error instanceof ValidationError || error instanceof AuthenticationError
        ? error.statusCode
        : 500;
    logEvent("error", "Failed to search templates", {
      ownerId,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(toErrorResponse(error, "Failed to search templates."), {
      status
    });
  }
}
