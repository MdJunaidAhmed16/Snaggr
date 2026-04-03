import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function getCachedFeed<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get<T>(key)
    return cached
  } catch (error) {
    console.error(`Redis getCachedFeed error for key ${key}:`, error)
    return null
  }
}

export async function setCachedFeed(
  key: string,
  data: unknown,
  ttlSeconds: number
): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), { ex: ttlSeconds })
  } catch (error) {
    console.error(`Redis setCachedFeed error for key ${key}:`, error)
  }
}

export async function incrementViewCount(domainId: number): Promise<number> {
  try {
    const key = `domain:views:${domainId}`
    const count = await redis.incr(key)
    // Set 24h TTL only on first increment
    if (count === 1) {
      await redis.expire(key, 86400)
    }
    return count
  } catch (error) {
    console.error(`Redis incrementViewCount error for domain ${domainId}:`, error)
    return 0
  }
}

export async function getViewCount(domainId: number): Promise<number> {
  try {
    const key = `domain:views:${domainId}`
    const count = await redis.get<number>(key)
    return count ?? 0
  } catch (error) {
    console.error(`Redis getViewCount error for domain ${domainId}:`, error)
    return 0
  }
}

export async function getCachedAvailability(domain: string): Promise<{ available: boolean; price?: number } | null> {
  try {
    const key = `domain:avail:${domain}`
    const cached = await redis.get<{ available: boolean; price?: number }>(key)
    return cached
  } catch (error) {
    console.error(`Redis getCachedAvailability error for domain ${domain}:`, error)
    return null
  }
}

export async function setCachedAvailability(
  domain: string,
  data: { available: boolean; price?: number }
): Promise<void> {
  try {
    const key = `domain:avail:${domain}`
    await redis.set(key, JSON.stringify(data), { ex: 3600 }) // 1 hour TTL
  } catch (error) {
    console.error(`Redis setCachedAvailability error for domain ${domain}:`, error)
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error(`Redis invalidateCache error for key ${key}:`, error)
  }
}
