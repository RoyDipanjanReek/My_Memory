// Login API Route
// Handles user authentication and session creation
// POST: Authenticate user with email/password, return session token

import { NextResponse } from "next/server";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth";
import { logEvent } from "@/lib/logger";
import {
  AuthenticationError,
  AuthValidationError,
  loginUser
} from "@/services/auth.service";
import { toErrorResponse } from "@/utils/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await loginUser(body);
    const response = NextResponse.json({ data: result.user });

    setSessionCookie(response, result.sessionToken, result.expiresAt);
    return response;
  } catch (error) {
    const status =
      error instanceof AuthValidationError || error instanceof AuthenticationError
        ? error.statusCode
        : 500;

    logEvent("error", "Failed to log in user", {
      error: error instanceof Error ? error.message : String(error)
    });

    const response = NextResponse.json(toErrorResponse(error, "Failed to sign in."), {
      status
    });
    clearSessionCookie(response);
    return response;
  }
}
