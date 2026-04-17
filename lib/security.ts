import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { RequestContext } from "@/types/observability.types";

export class SecurityError extends Error {
  statusCode = 403;
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  return forwardedFor?.split(",")[0]?.trim() ?? realIp?.trim() ?? null;
}

export function getRequestContext(request: Request): RequestContext {
  const requestUrl = new URL(request.url);

  return {
    requestId: request.headers.get("x-request-id") ?? randomUUID(),
    method: request.method,
    path: requestUrl.pathname,
    origin: request.headers.get("origin"),
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent")
  };
}

export function attachRequestHeaders(response: NextResponse, context: RequestContext) {
  response.headers.set("x-request-id", context.requestId);
  return response;
}

export function ensureSameOriginRequest(request: Request) {
  const method = request.method.toUpperCase();

  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return;
  }

  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  const allowedOrigin = process.env.APP_ORIGIN?.trim() || requestOrigin;

  if (origin && origin !== allowedOrigin) {
    throw new SecurityError("Invalid request origin.");
  }
}

export function hashRequestBody(value: unknown) {
  return createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");
}

export function deriveDeviceLabel(userAgent: string | null | undefined) {
  if (!userAgent) {
    return "Unknown device";
  }

  if (/mobile|android|iphone|ipad/i.test(userAgent)) {
    return "Mobile browser";
  }

  if (/chrome/i.test(userAgent)) {
    return "Chrome";
  }

  if (/firefox/i.test(userAgent)) {
    return "Firefox";
  }

  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    return "Safari";
  }

  if (/edg/i.test(userAgent)) {
    return "Edge";
  }

  return "Web session";
}
