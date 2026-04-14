type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs?: number;
  resetAt: number;
  limit: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;
let lastSweepAt = 0;

function sweepExpiredBuckets(now: number) {
  if (now - lastSweepAt < 30_000 && buckets.size < MAX_BUCKETS) {
    return;
  }

  lastSweepAt = now;

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now || buckets.size > MAX_BUCKETS) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweepExpiredBuckets(now);

  const bucket = buckets.get(key);

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

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: bucket.resetAt - now,
      resetAt: bucket.resetAt,
      limit
    };
  }

  bucket.count += 1;

  return {
    ok: true,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    limit
  };
}

export function buildRateLimitHeaders(result: RateLimitResult) {
  const headers = new Headers({
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000))
  });

  if (!result.ok && typeof result.retryAfterMs === "number") {
    headers.set("Retry-After", String(Math.max(1, Math.ceil(result.retryAfterMs / 1000))));
  }

  return headers;
}
