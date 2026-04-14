const FALLBACK_OWNER_ID = "local-user";

function sanitizeOwnerId(value: string | null) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized.replace(/[^a-z0-9-_]/g, "").slice(0, 48) || FALLBACK_OWNER_ID;
}

export function getOwnerId(headers: Headers) {
  return sanitizeOwnerId(headers.get("x-user-id") ?? process.env.DEFAULT_USER_ID ?? null);
}

export function getRequestContext(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  return {
    ownerId: getOwnerId(request.headers),
    requestId
  };
}
