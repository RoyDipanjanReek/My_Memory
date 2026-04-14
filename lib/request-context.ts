// Request context utilities for extracting user and request information
// Provides secure parsing and validation of request headers

// Fallback owner ID when user ID cannot be determined
const FALLBACK_OWNER_ID = "local-user";

/**
 * Sanitizes and validates owner ID from request headers
 * Removes special characters and enforces size limits
 * @param value - Raw owner ID from header
 * @returns Sanitized owner ID or fallback if invalid
 */
function sanitizeOwnerId(value: string | null) {
  // Normalize: trim, lowercase, remove special chars, limit length
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized.replace(/[^a-z0-9-_]/g, "").slice(0, 48) || FALLBACK_OWNER_ID;
}

/**
 * Extracts and validates owner ID from request headers
 * Tries x-user-id header first, then DEFAULT_USER_ID env var
 * @param headers - Request headers object
 * @returns Sanitized owner ID
 */
export function getOwnerId(headers: Headers) {
  return sanitizeOwnerId(headers.get("x-user-id") ?? process.env.DEFAULT_USER_ID ?? null);
}

/**
 * Builds request context from HTTP request
 * Includes owner ID and request ID for tracking
 * @param request - HTTP request object
 * @returns Context object with ownerId and requestId
 */
export function getRequestContext(request: Request) {
  // Use x-request-id header or generate new UUID for request tracking
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  return {
    ownerId: getOwnerId(request.headers),
    requestId
  };
}
