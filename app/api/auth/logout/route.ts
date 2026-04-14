import { NextResponse } from "next/server";
import { clearSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth";
import { logoutUser } from "@/services/auth.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  const sessionToken = match?.[1] ?? null;

  await logoutUser(sessionToken);

  const response = NextResponse.json({ data: { success: true } });
  clearSessionCookie(response);
  return response;
}
