// Rate limiting implementation using in-memory token bucket algorithm
// Prevents API abuse by limiting requests per key within time windows

/**
 * Represents a rate limit bucket for a specific key
 */
type Bucket = {
  count: number; // Number of requests used in current window
  resetAt: number; // Timestamp when this bucket expires
};

/**
 * Result of a rate limit check
 */
type RateLimitResult = {
  ok: boolean; // Whether the request is within limits
  remaining: number; // Requests remaining in current window
  retryAfterMs?: number; // How long to wait before retrying (if rate limited)
  resetAt: number; // When the window resets (unix timestamp)
  limit: number; // Maximum requests allowed in window
};

// In-memory storage of all rate limit buckets
const buckets = new Map<string, Bucket>();

// Maximum number of buckets before cleanup is required
const MAX_BUCKETS = 5000;

// Track when buckets were last cleaned up
let lastSweepAt = 0;

/**
 * Removes expired buckets from memory to prevent memory leaks
 * Runs periodically or when bucket count exceeds threshold
 * @param now - Current timestamp in milliseconds
 */
function sweepExpiredBuckets(now: number) {
  // Only sweep if enough time has passed or we're reaching max buckets
  if (now - lastSweepAt < 30_000 && buckets.size < MAX_BUCKETS) {
    return;
  }

  lastSweepAt = now;

  // Remove expired buckets or excess buckets
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now || buckets.size > MAX_BUCKETS) {
      buckets.delete(key);
    }
  }
}

/**
 * Checks if a request is within rate limits
 * Creates new bucket if one doesn't exist
 * Updates existing bucket count if within window
 * @param key - Unique identifier for the rate limit (e.g., user ID + endpoint)
 * @param limit - Maximum requests allowed in the time window
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit check result
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  // Clean up expired buckets periodically
  sweepExpiredBuckets(now);

  const bucket = buckets.get(key);

  // If bucket doesn't exist or has expired, create a new one
  if (!bucket || now > bucket.resetAt) {
    const nextBucket = {
      count: 1,
      resetAt: now + windowMs
    };

    buckets.set(key, nextBucket);

    return {
      ok: true,
      remaining: limit - 1,
      resetAt: nextBucket.resetAt,
      limit
    };
  }

  // If limit reached, reject request
  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: bucket.resetAt - now,
      resetAt: bucket.resetAt,
      limit
    };
  }

  // Increment bucket count and allow request
  bucket.count += 1;

  return {
    ok: true,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    limit
  };
}

/**
 * Builds HTTP headers to include in response for rate limit info
 * Follows standard RateLimit headers specification
 * @param result - Rate limit check result
 * @returns Headers object with rate limit information
 */
export function buildRateLimitHeaders(result: RateLimitResult) {
  const headers = new Headers({
    // Standard RateLimit headers
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000))
  });

  // Add Retry-After header if rate limited
  if (!result.ok && typeof result.retryAfterMs === "number") {
    headers.set("Retry-After", String(Math.max(1, Math.ceil(result.retryAfterMs / 1000))));
  }

  return headers;
}
