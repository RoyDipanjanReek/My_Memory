// Next.js middleware for request-level authentication and routing logic
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

// Routes that require authentication
const PROTECTED_PATHS = ["/workspace", "/api/templates", "/api/search"];

// Authentication-related pages that should redirect to workspace if already logged in
const AUTH_PAGES = ["/login", "/signup"];

/**
 * Checks if a given pathname is a protected route requiring authentication
 * @param pathname - The URL pathname to check
 * @returns true if the path is protected
 */
function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

/**
 * Checks if a pathname is an authentication page (login/signup)
 * @param pathname - The URL pathname to check
 * @returns true if the path is an auth page
 */
function isAuthPage(pathname: string) {
  return AUTH_PAGES.includes(pathname);
}

/**
 * Main middleware function that runs on every request
 * Handles:
 * - Redirecting unauthenticated users to login
 * - Redirecting authenticated users away from login/signup pages
 * @param request - The incoming HTTP request
 * @returns Response (either continue, redirect, or error)
 */
export function middleware(request: NextRequest) {
  // Extract session token from cookies
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  // If accessing protected path without session token, redirect to login
  if (isProtectedPath(pathname) && !sessionToken) {
    // For API routes, return 401 JSON error
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // For page routes, redirect to login with return URL
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // If already authenticated and trying to access auth pages, redirect to workspace
  if (isAuthPage(pathname) && sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/workspace";
    return NextResponse.redirect(url);
  }

  // All other requests continue normally
  return NextResponse.next();
}

// Configuration for which routes this middleware should run on
export const config = {
  matcher: ["/workspace/:path*", "/login", "/signup", "/api/templates/:path*", "/api/search"]
};
