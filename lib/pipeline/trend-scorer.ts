import type { ExtractedKeyword } from './keyword-extractor'
import type { TrendItem } from './sources/google-trends'

export interface ScoredKeyword extends ExtractedKeyword {
  trend_score: number
  github_stars_delta?: number
}

interface ScoringInputs {
  keywords: ExtractedKeyword[]
  trends: TrendItem[]
  githubStarDeltas?: Map<string, number>
}

function getGoogleTrendsVelocity(
  keyword: string,
  trends: TrendItem[]
): number {
  const lower = keyword.toLowerCase()
  for (const trend of trends) {
    if (
      trend.term.toLowerCase().includes(lower) ||
      lower.includes(trend.term.toLowerCase())
    ) {
      return trend.velocity
    }
  }
  return 0
}

function countActiveSources(keyword: ExtractedKeyword): number {
  let count = 0
  if (keyword.sourceCounts.hn > 0) count++
  if (keyword.sourceCounts.github > 0) count++
  if (keyword.sourceCounts.trends > 0) count++
  return count
}

export function scoreKeywords({
  keywords,
  trends,
  githubStarDeltas,
}: ScoringInputs): ScoredKeyword[] {
  const scored: ScoredKeyword[] = keywords.map((kw) => {
    const hn_mentions = kw.sourceCounts.hn
    const google_trends_velocity = getGoogleTrendsVelocity(kw.keyword, trends)
    const github_stars_delta =
      githubStarDeltas?.get(kw.keyword) ?? kw.sourceCounts.github * 100
    const ph_upvotes = 0 // Product Hunt integration placeholder

    // Base score formula
    let trend_score =
      hn_mentions * 2.0 +
      google_trends_velocity * 3.0 +
      github_stars_delta * 0.0015 + // normalize large star counts
      ph_upvotes * 1.0

    // Convergence bonus: 1.5x if appearing in 3+ sources
    const sourcesActive = countActiveSources(kw)
    if (sourcesActive >= 3) {
      trend_score *= 1.5
    }

    return {
      ...kw,
      trend_score: Math.round(trend_score * 100) / 100,
      github_stars_delta,
    }
  })

  // Sort by trend_score descending
  return scored.sort((a, b) => b.trend_score - a.trend_score)
}
