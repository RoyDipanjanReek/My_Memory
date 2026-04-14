// Authentication utilities for session management, user verification, and cookie handling
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

// Cookie name used to store session tokens
export const SESSION_COOKIE_NAME = "developer_memory_session";

/**
 * Sets a secure session cookie on the response
 * Uses httpOnly flag to prevent client-side access (security best practice)
 * @param response - The Next.js response object
 * @param token - The session token to store
 * @param expiresAt - When the session should expire
 */
export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true, // Prevent JavaScript access to the cookie
    sameSite: "lax", // CSRF protection
    secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
    path: "/", // Cookie available to entire application
    expires: expiresAt // When to remove the cookie
  });
}

/**
 * Clears the session cookie by setting it to empty with an expired date
 * @param response - The Next.js response object
 */
export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0) // Set to epoch (immediately expired)
  });
}

/**
 * Lazy-loads the auth service module to avoid circular dependencies
 * @returns The auth service module
 */
async function getAuthService() {
  return await import("@/services/auth.service");
}

/**
 * Gets the current authenticated user from the session cookie
 * Call this in Server Components to get the current user
 * @returns The current user object or null if not authenticated
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const { getAuthenticatedUser } = await getAuthService();
  return getAuthenticatedUser(token);
}

/**
 * Gets the current authenticated user from an HTTP request
 * Used in API route handlers to extract user from request cookies
 * @param request - The HTTP request object
 * @returns The current user object or null if not authenticated
 */
export async function getCurrentUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  const token = match?.[1] ?? null;
  const { getAuthenticatedUser } = await getAuthService();
  return getAuthenticatedUser(token);
}

/**
 * Ensures user is authenticated when making API requests
 * Throws error if user is not authenticated
 * @param request - The HTTP request object
 * @returns The authenticated user object
 * @throws Error if authentication fails
 */
export async function requireUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  const token = match?.[1] ?? null;
  const { requireAuthenticatedUser } = await getAuthService();
  return requireAuthenticatedUser(token);
}

/**
 * Ensures user is authenticated in Server Components
 * If not authenticated, redirects to login page
 * @returns The authenticated user object
 * @throws Redirects to /login if authentication fails
 */
export async function requireCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  try {
    const { requireAuthenticatedUser } = await getAuthService();
    return await requireAuthenticatedUser(token);
  } catch {
    // If authentication fails, redirect to login page
    redirect("/login");
  }
}
