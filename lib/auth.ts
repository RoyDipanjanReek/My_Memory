// Authentication utilities for session management, user verification, and cookie handling
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { deriveDeviceLabel, getRequestContext } from "@/lib/security";

function parseSessionToken(cookieHeader: string) {
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  return match?.[1] ?? null;
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    priority: "high",
    expires: expiresAt
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    priority: "high",
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
  const token = parseSessionToken(request.headers.get("cookie") ?? "");
  const { getAuthenticatedUser } = await getAuthService();
  return getAuthenticatedUser(token);
}

export async function requireUserFromRequest(request: Request) {
  const token = parseSessionToken(request.headers.get("cookie") ?? "");
  const context = getRequestContext(request);
  const { requireAuthenticatedUser } = await getAuthService();
  return requireAuthenticatedUser(token, context);
}

export async function requireSessionFromRequest(request: Request) {
  const token = parseSessionToken(request.headers.get("cookie") ?? "");
  const context = getRequestContext(request);
  const { requireAuthenticatedSession } = await getAuthService();
  return requireAuthenticatedSession(token, context);
}

export function getSessionTokenFromRequest(request: Request) {
  return parseSessionToken(request.headers.get("cookie") ?? "");
}

export function getSessionDeviceInfo(request: Request) {
  const context = getRequestContext(request);

  return {
    userAgent: context.userAgent,
    ipAddress: context.ipAddress,
    deviceLabel: deriveDeviceLabel(context.userAgent)
  };
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
