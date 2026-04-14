import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "developer_memory_session";

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0)
  });
}

async function getAuthService() {
  return await import("@/services/auth.service");
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const { getAuthenticatedUser } = await getAuthService();
  return getAuthenticatedUser(token);
}

export async function getCurrentUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  const token = match?.[1] ?? null;
  const { getAuthenticatedUser } = await getAuthService();
  return getAuthenticatedUser(token);
}

export async function requireUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  const token = match?.[1] ?? null;
  const { requireAuthenticatedUser } = await getAuthService();
  return requireAuthenticatedUser(token);
}

export async function requireCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  try {
    const { requireAuthenticatedUser } = await getAuthService();
    return await requireAuthenticatedUser(token);
  } catch {
    redirect("/login");
  }
}
