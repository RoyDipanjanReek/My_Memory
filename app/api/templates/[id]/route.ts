import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { buildRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { logEvent } from "@/lib/logger";
import { AuthenticationError } from "@/services/auth.service";
import {
  NotFoundError,
  ValidationError,
  deleteTemplate,
  getTemplate,
  updateTemplate
} from "@/services/template.service";
import { toErrorResponse } from "@/utils/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const template = await getTemplate(user.id, params.id);
    return NextResponse.json({ data: template });
  } catch (error) {
    const status =
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof AuthenticationError
        ? error.statusCode
        : 500;

    logEvent("error", "Failed to load template", {
      ownerId,
      templateId: params.id,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(toErrorResponse(error, "Failed to load template."), {
      status
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const limitCheck = checkRateLimit(`${user.id}:templates:delete`, 20, 60_000);

    if (!limitCheck.ok) {
      return NextResponse.json(
        { error: "Delete rate limit exceeded. Please retry shortly." },
        { status: 429, headers: buildRateLimitHeaders(limitCheck) }
      );
    }

    const deleted = await deleteTemplate(user.id, params.id);
    return NextResponse.json(
      { data: deleted },
      { headers: buildRateLimitHeaders(limitCheck) }
    );
  } catch (error) {
    const status =
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof AuthenticationError
        ? error.statusCode
        : 500;

    logEvent("error", "Failed to delete template", {
      ownerId,
      templateId: params.id,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(toErrorResponse(error, "Failed to delete template."), {
      status
    });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const limitCheck = checkRateLimit(`${user.id}:templates:patch`, 40, 60_000);

    if (!limitCheck.ok) {
      return NextResponse.json(
        { error: "Update rate limit exceeded. Please retry shortly." },
        { status: 429, headers: buildRateLimitHeaders(limitCheck) }
      );
    }

    const body = await request.json().catch(() => ({}));
    const updated = await updateTemplate(user.id, params.id, body);

    return NextResponse.json(
      { data: updated },
      { headers: buildRateLimitHeaders(limitCheck) }
    );
  } catch (error) {
    const status =
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof AuthenticationError
        ? error.statusCode
        : 500;

    logEvent("error", "Failed to update template", {
      ownerId,
      templateId: params.id,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(toErrorResponse(error, "Failed to update template."), {
      status
    });
  }
}
