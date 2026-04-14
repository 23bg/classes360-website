import { env } from "@/lib/config/env";

type Bucket = {
    count: number;
    resetAt: number;
};

const buckets = new Map<string, Bucket>();

/**
 * enforceRateLimit - async rate limiter that prefers Upstash Redis REST when configured,
 * falling back to an in-process Map for local/dev environments.
 */
export async function enforceRateLimit(
    key: string,
    limit: number,
    windowMs: number
): Promise<{ ok: boolean; retryAfter: number }> {
    // Try Upstash REST if configured
    const upstashUrl = env.UPSTASH_REDIS_REST_URL;
    const upstashToken = env.UPSTASH_REDIS_REST_TOKEN;

    if (upstashUrl && upstashToken) {
        try {
            // INCR the key
            const incrResp = await fetch(upstashUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${upstashToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ cmd: ["INCR", key] }),
            });

            const incrJson = await incrResp.json();
            const value = (incrJson?.result ?? incrJson) as number;

            if (value === 1) {
                // Set expiry in milliseconds
                await fetch(upstashUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${upstashToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ cmd: ["PEXPIRE", key, `${windowMs}`] }),
                });
            }

            if (value > limit) {
                // Get remaining TTL
                const ttlResp = await fetch(upstashUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${upstashToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ cmd: ["PTTL", key] }),
                });

                const ttlJson = await ttlResp.json();
                const ms = (ttlJson?.result ?? ttlJson) as number;
                const retryAfter = Math.max(0, Math.ceil((ms ?? windowMs) / 1000));
                return { ok: false, retryAfter };
            }

            return { ok: true, retryAfter: 0 };
        } catch {
            // Fall through to in-memory fallback on error
        }
    }

    // In-memory fallback (not suitable for multi-instance production)
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || now > existing.resetAt) {
        buckets.set(key, {
            count: 1,
            resetAt: now + windowMs,
        });
        return { ok: true, retryAfter: 0 };
    }

    if (existing.count >= limit) {
        return { ok: false, retryAfter: Math.max(0, Math.ceil((existing.resetAt - now) / 1000)) };
    }

    existing.count += 1;
    return { ok: true, retryAfter: 0 };
}

