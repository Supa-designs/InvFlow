import { upstashRedis } from "@/lib/cache/upstash";

const TTL_SECONDS = 60 * 5;

function tenantIndexKey(tenantId: string) {
  return `cache:products:tenant:${tenantId}:keys`;
}

async function trackKey(tenantId: string, key: string) {
  if (!upstashRedis) return;
  await upstashRedis.sadd(tenantIndexKey(tenantId), key);
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  if (!upstashRedis) return null;
  const value = await upstashRedis.get<T>(key);
  return value ?? null;
}

export async function setCachedJson<T>(tenantId: string, key: string, value: T) {
  if (!upstashRedis) return;
  await upstashRedis.set(key, value, { ex: TTL_SECONDS });
  await trackKey(tenantId, key);
}

export async function invalidateTenantProductCache(tenantId: string) {
  if (!upstashRedis) return;
  const indexKey = tenantIndexKey(tenantId);
  const keys = (await upstashRedis.smembers<string[]>(indexKey)) || [];
  if (keys.length > 0) {
    await upstashRedis.del(...keys);
  }
  await upstashRedis.del(indexKey);
}

