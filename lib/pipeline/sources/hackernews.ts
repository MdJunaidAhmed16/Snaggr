export interface HNItem {
  id: number
  title: string
  score: number
  url?: string
  descendants?: number
  type?: string
}

const HN_BASE = 'https://hacker-news.firebaseio.com/v0'

async function fetchItem(id: number): Promise<HNItem | null> {
  try {
    const res = await fetch(`${HN_BASE}/item/${id}.json`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchStoryIds(endpoint: string): Promise<number[]> {
  try {
    const res = await fetch(`${HN_BASE}/${endpoint}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function fetchHNSignals(): Promise<HNItem[]> {
  try {
    // Fetch top stories and show HN stories in parallel
    const [topIds, showIds] = await Promise.all([
      fetchStoryIds('topstories.json'),
      fetchStoryIds('showstories.json'),
    ])

    // Take first 30 top stories and first 15 show HN
    const topSlice = topIds.slice(0, 30)
    const showSlice = showIds.slice(0, 15)

    // Deduplicate IDs
    const allIds = Array.from(new Set([...topSlice, ...showSlice]))

    // Fetch all items in parallel
    const items = await Promise.all(allIds.map((id) => fetchItem(id)))

    // Filter out nulls and items without titles
    const validItems = items.filter(
      (item): item is HNItem =>
        item !== null &&
        typeof item.title === 'string' &&
        item.title.length > 0
    )

    return validItems
  } catch (error) {
    console.error('fetchHNSignals error:', error)
    return []
  }
}
