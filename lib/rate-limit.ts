/**
 * Rate limiting: Upstash Redis when configured, else in-memory Map fallback.
 * Memory limiter is per-instance (fine for single Vercel region / low traffic).
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

type Bucket = { count: number; resetAt: number };
const memoryBuckets = new Map<string, Bucket>();

const MAX_MEMORY_KEYS = 5000;

function pruneMemory(now: number) {
  if (memoryBuckets.size < MAX_MEMORY_KEYS) return;
  for (const [k, v] of memoryBuckets) {
    if (v.resetAt <= now) memoryBuckets.delete(k);
  }
  if (memoryBuckets.size >= MAX_MEMORY_KEYS) {
    const first = memoryBuckets.keys().next().value;
    if (first) memoryBuckets.delete(first);
  }
}

function rateLimitMemory(
  key: string,
  limit: number,
  windowSec: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  pruneMemory(now);
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
  };
}

async function rateLimitRedis(
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ allowed: boolean; remaining: number } | null> {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  try {
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSec, 'NX'],
      ]),
    });
    if (!res.ok) return null;
    const results = (await res.json()) as Array<{ result: number }>;
    const count = results[0]?.result ?? 1;
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
    };
  } catch {
    return null;
  }
}

/** Generic rate limit. Prefer Redis; always fall back to memory (never fail-open). */
export async function rateLimit(
  prefix: string,
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const fullKey = `rl:${prefix}:${key}`;
  const redis = await rateLimitRedis(fullKey, limit, windowSec);
  if (redis) return redis;
  return rateLimitMemory(fullKey, limit, windowSec);
}

/** Analyze API — per authenticated user */
export async function rateLimitAnalyze(
  userId: string,
  limit = 30,
  windowSec = 3600,
): Promise<{ allowed: boolean; remaining: number }> {
  return rateLimit('analyze', userId, limit, windowSec);
}

/** Extension capture — per IP */
export async function rateLimitExtensionCapture(
  ipKey: string,
  limit = 60,
  windowSec = 3600,
): Promise<{ allowed: boolean; remaining: number }> {
  return rateLimit('ext-capture', ipKey, limit, windowSec);
}

export function clientIpFromRequest(request: {
  headers: { get(name: string): string | null };
}): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/** Test helper — clear memory buckets */
export function __resetMemoryRateLimitForTests() {
  memoryBuckets.clear();
}
