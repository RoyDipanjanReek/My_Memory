import { NextResponse } from "next/server";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth";
import { logEvent } from "@/lib/logger";
import {
  AuthValidationError,
  registerUser
} from "@/services/auth.service";
import { toErrorResponse } from "@/utils/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await registerUser(body);
    const response = NextResponse.json({ data: result.user }, { status: 201 });

    setSessionCookie(response, result.sessionToken, result.expiresAt);
    return response;
  } catch (error) {
    const status = error instanceof AuthValidationError ? error.statusCode : 500;

    logEvent("error", "Failed to register user", {
      error: error instanceof Error ? error.message : String(error)
    });

    const response = NextResponse.json(toErrorResponse(error, "Failed to register user."), {
      status
    });
    clearSessionCookie(response);
    return response;
  }
}
