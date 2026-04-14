import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { buildRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { logEvent } from "@/lib/logger";
import { AuthenticationError } from "@/services/auth.service";
import {
  ValidationError,
  createTemplate,
  getTemplates,
  runBulkTemplateAction
} from "@/services/template.service";
import type { TemplateFilters } from "@/types/template.types";
import { toErrorResponse } from "@/utils/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ensureConfigured() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "MONGODB_URI is not configured." },
      { status: 503 }
    );
  }

  return null;
}

export async function GET(request: Request) {
  const configuredResponse = ensureConfigured();
  if (configuredResponse) {
    return configuredResponse;
  }

  let ownerId = "unknown";

  try {
    const user = await requireUserFromRequest(request);
    ownerId = user.id;
    const limitCheck = checkRateLimit(`${user.id}:templates:read`, 90, 60_000);

    if (!limitCheck.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please retry shortly." },
        { status: 429, headers: buildRateLimitHeaders(limitCheck) }
      );
    }

    const { searchParams } = new URL(request.url);
    const templates = await getTemplates(user.id, {
      query: searchParams.get("q") ?? "",
      category: (searchParams.get("category") ?? "all") as TemplateFilters["category"],
      tag: searchParams.get("tag") ?? "",
      collection: searchParams.get("collection") ?? "",
      view: (searchParams.get("view") ?? "all") as TemplateFilters["view"],
      includeArchived: searchParams.get("archived") === "true",
      limit: Number(searchParams.get("limit") ?? 24),
      cursor: searchParams.get("cursor")
    });

    return NextResponse.json(templates, {
      headers: buildRateLimitHeaders(limitCheck)
    });
  } catch (error) {
    logEvent("error", "Failed to load templates", {
      ownerId,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(toErrorResponse(error, "Failed to load templates."), {
      status: error instanceof AuthenticationError ? error.statusCode : 500
    });
  }
}

export async function POST(request: Request) {
  const configuredResponse = ensureConfigured();
  if (configuredResponse) {
    return configuredResponse;
  }

  let ownerId = "unknown";

  try {
    const user = await requireUserFromRequest(request);
    ownerId = user.id;
    const limitCheck = checkRateLimit(`${user.id}:templates:write`, 30, 60_000);

    if (!limitCheck.ok) {
      return NextResponse.json(
        { error: "Write rate limit exceeded. Please retry shortly." },
        { status: 429, headers: buildRateLimitHeaders(limitCheck) }
      );
    }

    const body = await request.json();
    const result = await createTemplate(user.id, body);

    return NextResponse.json(
      {
        data: result.template,
        meta: {
          duplicate: result.duplicate
        }
      },
      {
        status: result.duplicate ? 200 : 201,
        headers: buildRateLimitHeaders(limitCheck)
      }
    );
  } catch (error) {
    const status =
      error instanceof ValidationError || error instanceof AuthenticationError
        ? error.statusCode
        : 500;
    logEvent("error", "Failed to create template", {
      ownerId,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(toErrorResponse(error, "Failed to create template."), {
      status
    });
  }
}

export async function PATCH(request: Request) {
  const configuredResponse = ensureConfigured();
  if (configuredResponse) {
    return configuredResponse;
  }

  let ownerId = "unknown";

  try {
    const user = await requireUserFromRequest(request);
    ownerId = user.id;
    const limitCheck = checkRateLimit(`${user.id}:templates:bulk`, 20, 60_000);

    if (!limitCheck.ok) {
      return NextResponse.json(
        { error: "Bulk action rate limit exceeded. Please retry shortly." },
        { status: 429, headers: buildRateLimitHeaders(limitCheck) }
      );
    }

    const body = await request.json();
    const templates = await runBulkTemplateAction(user.id, body);

    return NextResponse.json(
      { data: templates },
      { headers: buildRateLimitHeaders(limitCheck) }
    );
  } catch (error) {
    const status =
      error instanceof ValidationError || error instanceof AuthenticationError
        ? error.statusCode
        : 500;
    logEvent("error", "Failed to run bulk template action", {
      ownerId,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(toErrorResponse(error, "Failed to update templates."), {
      status
    });
  }
}
