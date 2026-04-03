import {
  getCachedAvailability,
  setCachedAvailability,
} from '../cache/redis'

export interface AvailabilityResult {
  available: boolean
  price?: number
  currency?: string
}

export async function checkDomainAvailability(
  domain: string
): Promise<AvailabilityResult> {
  // Check Redis cache first
  const cached = await getCachedAvailability(domain)
  if (cached !== null) {
    return cached
  }

  try {
    const parts = domain.split('.')
    const tld = parts.slice(1).join('.')
    const name = parts[0]

    const apiKey = process.env.NAMECRAWL_API_KEY
    if (!apiKey) {
      console.warn('NAMECRAWL_API_KEY not set, returning mock availability')
      const mockResult: AvailabilityResult = { available: Math.random() > 0.5 }
      await setCachedAvailability(domain, mockResult)
      return mockResult
    }

    const url = `https://api.namecrawl.dev/api/v1/search?domain=${encodeURIComponent(name)}&tlds=${encodeURIComponent(tld)}`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      throw new Error(`NameCrawl API responded ${res.status}: ${await res.text()}`)
    }

    const data = await res.json()

    // Parse nameCrawl response format
    const domainData = data?.domains?.[0] ?? data?.results?.[0] ?? data

    const result: AvailabilityResult = {
      available: domainData?.available === true || domainData?.status === 'available',
      price: domainData?.price ?? domainData?.price_usd ?? undefined,
      currency: domainData?.currency ?? 'USD',
    }

    await setCachedAvailability(domain, result)
    return result
  } catch (error) {
    console.error(`checkDomainAvailability error for ${domain}:`, error)
    // Return unknown availability on error rather than crashing
    return { available: false }
  }
}

// Limit concurrency for bulk checks
async function pLimit<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = []
  let index = 0

  async function worker() {
    while (index < tasks.length) {
      const currentIndex = index++
      results[currentIndex] = await tasks[currentIndex]()
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker)
  await Promise.all(workers)
  return results
}

export async function bulkCheckAvailability(
  domains: string[]
): Promise<Map<string, AvailabilityResult>> {
  const tasks = domains.map(
    (domain) => () => checkDomainAvailability(domain).then((result) => ({ domain, result }))
  )

  const results = await pLimit(tasks, 5)

  const map = new Map<string, AvailabilityResult>()
  for (const { domain, result } of results) {
    map.set(domain, result)
  }
  return map
}
