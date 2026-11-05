// Rate limiting, added 2026-11-05 with the security hardening.
// A fixed window counter kept in memory per server instance. It
// slows down password guessing and form spam from one address, and
// it needs no new service or database table. Limitation, stated
// plainly: on Vercel each running instance keeps its own counters
// and a cold start resets them, so this is a speed bump, not a hard
// guarantee. A shared store (for example a database table or Upstash
// Redis) is the next step if abuse shows up in the logs.

const buckets = new Map();
const MAX_BUCKETS = 10000;

// Returns { allowed, remaining, retryAfterSeconds }. key is any
// string, for example "login:ip:1.2.3.4". limit is the number of
// attempts allowed per windowMs. nowMs is passed by tests.
export function checkRateLimit(key, limit, windowMs, nowMs) {
  const now = typeof nowMs === "number" ? nowMs : Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [storedKey, stored] of buckets) {
        if (stored.resetAt <= now) {
          buckets.delete(storedKey);
        }
      }
      if (buckets.size >= MAX_BUCKETS) {
        buckets.delete(buckets.keys().next().value);
      }
    }
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  const allowed = bucket.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
  };
}

export function resetRateLimits() {
  buckets.clear();
}

// The caller address on Vercel is the first entry of
// x-forwarded-for. Falls back to x-real-ip, then to "unknown", so a
// missing header shares one bucket instead of skipping the limit.
export function clientAddress(headers) {
  const forwarded = (headers && headers.get && headers.get("x-forwarded-for")) || "";
  const first = forwarded.split(",")[0].trim();
  if (first) {
    return first;
  }
  const real = (headers && headers.get && headers.get("x-real-ip")) || "";
  return real.trim() || "unknown";
}

export function tooManyRequestsResponse(result) {
  return Response.json(
    { error: "Too many attempts. Please wait a few minutes and try again." },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } }
  );
}
