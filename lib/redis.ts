/**
 * Optional Upstash Redis rate limiter.
 * Falls back to no-op when UPSTASH_REDIS_REST_URL is not set.
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function rateLimitAnalyze(
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ allowed: boolean; remaining: number }> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return { allowed: true, remaining: limit };
  }

  try {
    const redisKey = `rl:analyze:${key}`;
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', redisKey],
        ['EXPIRE', redisKey, windowSec, 'NX'],
      ]),
    });

    if (!res.ok) return { allowed: true, remaining: limit };

    const results = (await res.json()) as Array<{ result: number }>;
    const count = results[0]?.result ?? 1;
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
    };
  } catch {
    return { allowed: true, remaining: limit };
  }
}
