// Session/Current User API Route
// GET /api/auth/session - Returns current authenticated user information
// Used by client to check authentication status

import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  const sessionToken = match?.[1] ?? null;
  const user = await getAuthenticatedUser(sessionToken);

  return NextResponse.json({
    data: {
      user
    }
  });
}
