import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { attachRequestHeaders } from "@/lib/security";
import type { RequestContext } from "@/types/observability.types";
import {
  completeIdempotencyRecord,
  getIdempotencyRecord,
  reserveIdempotencyRecord
} from "@/repositories/idempotency.repository";

type JsonMutationOptions = {
  ownerId: string | null;
  method: string;
  path: string;
  key: string | null;
  requestHash: string;
  ttlMs?: number;
  context?: RequestContext;
  rotatedSession?: {
    token: string;
    expiresAt: Date;
  } | null;
};

type JsonMutationResult = {
  body: unknown;
  status?: number;
  headers?: HeadersInit;
  sessionCookie?: {
    token: string;
    expiresAt: Date;
  } | null;
};

export async function runIdempotentJsonMutation(
  options: JsonMutationOptions,
  execute: () => Promise<JsonMutationResult>
) {
  const finalizeResponse = (
    response: NextResponse,
    sessionCookie?: {
      token: string;
      expiresAt: Date;
    } | null
  ) => {
    const activeSessionCookie = sessionCookie ?? options.rotatedSession;

    if (activeSessionCookie) {
      setSessionCookie(response, activeSessionCookie.token, activeSessionCookie.expiresAt);
    }

    if (options.context) {
      attachRequestHeaders(response, options.context);
    }

    return response;
  };

  if (!options.key) {
    const result = await execute();
    return finalizeResponse(NextResponse.json(result.body, {
      status: result.status,
      headers: result.headers
    }), result.sessionCookie);
  }

  const existing = await getIdempotencyRecord({
    ownerId: options.ownerId,
    key: options.key,
    method: options.method,
    path: options.path
  });

  if (existing) {
    if (existing.requestHash !== options.requestHash) {
      return finalizeResponse(NextResponse.json(
        { error: "Idempotency key reuse does not match the original request." },
        { status: 409 }
      ));
    }

    if (!existing.completedAt) {
      return finalizeResponse(NextResponse.json(
        { error: "A matching request is already being processed." },
        { status: 409 }
      ));
    }

    return finalizeResponse(NextResponse.json(JSON.parse(existing.responseBody ?? "{}"), {
      status: existing.statusCode ?? 200,
      headers: {
        "Idempotent-Replayed": "true"
      }
    }));
  }

  const reserved = await reserveIdempotencyRecord({
    ownerId: options.ownerId,
    key: options.key,
    method: options.method,
    path: options.path,
    requestHash: options.requestHash,
    expiresAt: new Date(Date.now() + (options.ttlMs ?? 1000 * 60 * 30))
  });

  if (!reserved) {
    return finalizeResponse(NextResponse.json(
      { error: "Could not reserve idempotency key." },
      { status: 409 }
    ));
  }

  const result = await execute();
  const status = result.status ?? 200;
  const body = JSON.stringify(result.body);

  await completeIdempotencyRecord(reserved.id, {
    statusCode: status,
    responseBody: body
  });

  return finalizeResponse(NextResponse.json(result.body, {
    status,
    headers: result.headers
  }), result.sessionCookie);
}
