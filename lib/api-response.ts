import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { attachRequestHeaders } from "@/lib/security";
import type { RequestContext } from "@/types/observability.types";

type JsonResponseOptions = {
  status?: number;
  headers?: HeadersInit;
  context?: RequestContext;
  rotatedSession?: {
    token: string;
    expiresAt: Date;
  } | null;
};

export function jsonResponse(body: unknown, options: JsonResponseOptions = {}) {
  const response = NextResponse.json(body, {
    status: options.status,
    headers: options.headers
  });

  if (options.rotatedSession) {
    setSessionCookie(response, options.rotatedSession.token, options.rotatedSession.expiresAt);
  }

  if (options.context) {
    attachRequestHeaders(response, options.context);
  }

  return response;
}
