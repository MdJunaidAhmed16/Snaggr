export interface GitHubRepo {
  name: string
  description: string
  stars: number
  language: string
  topics: string[]
}

interface OSSInsightRepo {
  repo_name: string
  description?: string
  total_score?: number
  primary_language?: string
  topics?: string[]
  stars?: number
}

interface GitHubSearchRepo {
  name: string
  description?: string
  stargazers_count: number
  language?: string
  topics?: string[]
}

async function fetchOSSInsight(): Promise<GitHubRepo[]> {
  try {
    const res = await fetch(
      'https://api.ossinsight.io/v1/trends/repos/?period=past_week',
      { next: { revalidate: 7200 } }
    )
    if (!res.ok) throw new Error(`OSS Insight responded ${res.status}`)
    const data = await res.json()
    const repos: OSSInsightRepo[] = data?.data?.rows ?? []

    return repos.map((r) => ({
      name: r.repo_name ?? '',
      description: r.description ?? '',
      stars: r.stars ?? 0,
      language: r.primary_language ?? '',
      topics: r.topics ?? [],
    }))
  } catch (error) {
    console.error('OSS Insight fetch failed:', error)
    return []
  }
}

async function fetchGitHubSearch(): Promise<GitHubRepo[]> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0]

    const query = encodeURIComponent(`created:>${dateStr} stars:>100`)
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=30`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Snaggr-Domain-Intelligence',
        },
        next: { revalidate: 7200 },
      }
    )

    if (!res.ok) throw new Error(`GitHub Search responded ${res.status}`)
    const data = await res.json()
    const items: GitHubSearchRepo[] = data?.items ?? []

    return items.map((r) => ({
      name: r.name ?? '',
      description: r.description ?? '',
      stars: r.stargazers_count ?? 0,
      language: r.language ?? '',
      topics: r.topics ?? [],
    }))
  } catch (error) {
    console.error('GitHub Search fetch failed:', error)
    return []
  }
}

export async function fetchGitHubSignals(): Promise<GitHubRepo[]> {
  // Try OSS Insight first, fall back to GitHub Search
  const ossInsight = await fetchOSSInsight()
  if (ossInsight.length > 0) {
    return ossInsight
  }
  return fetchGitHubSearch()
}
