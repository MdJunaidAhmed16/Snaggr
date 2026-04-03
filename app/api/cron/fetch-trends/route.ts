import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import { invalidateCache } from '@/lib/cache/redis'
import { fetchHNSignals } from '@/lib/pipeline/sources/hackernews'
import { fetchGitHubSignals } from '@/lib/pipeline/sources/github'
import { fetchGoogleTrendsSignals } from '@/lib/pipeline/sources/google-trends'
import { extractKeywords } from '@/lib/pipeline/keyword-extractor'
import { scoreKeywords } from '@/lib/pipeline/trend-scorer'
import { generateDomainCandidates } from '@/lib/pipeline/domain-generator'
import { bulkCheckAvailability } from '@/lib/domain/availability'
import { getAffiliateLink } from '@/lib/domain/affiliate'

export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  // Verify cron secret — required, no bypass if env var is missing
  const cronSecret =
    request.headers.get('x-cron-secret') ??
    request.headers.get('authorization')?.replace('Bearer ', '')

  if (!process.env.CRON_SECRET) {
    console.error('CRON_SECRET env var is not set — cron endpoint is disabled')
    return NextResponse.json({ error: 'Service misconfigured' }, { status: 503 })
  }

  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log: string[] = []

  try {
    log.push('Starting trend pipeline...')

    // Step 1: Fetch signals from all sources in parallel
    const [hnItems, githubRepos, trends] = await Promise.all([
      fetchHNSignals().catch((e) => { log.push(`HN error: ${e.message}`); return [] }),
      fetchGitHubSignals().catch((e) => { log.push(`GitHub error: ${e.message}`); return [] }),
      fetchGoogleTrendsSignals().catch((e) => { log.push(`Google Trends error: ${e.message}`); return [] }),
    ])

    log.push(`Fetched: ${hnItems.length} HN items, ${githubRepos.length} GitHub repos, ${trends.length} trends`)

    // Step 2: Extract keywords
    const keywords = extractKeywords(hnItems, githubRepos, trends)
    log.push(`Extracted ${keywords.length} keywords`)

    // Step 3: Score keywords
    const scored = scoreKeywords({ keywords, trends })
    const topKeywords = scored.slice(0, 10) // Process top 10
    log.push(`Top keywords: ${topKeywords.map((k) => k.keyword).join(', ')}`)

    // Step 4: Store keywords in DB and generate domain candidates
    for (const kw of topKeywords) {
      try {
        // Upsert keyword
        const sources = {
          hn: kw.sourceCounts.hn,
          github: kw.sourceCounts.github,
          trends: kw.sourceCounts.trends,
        }

        const { rows: kwRows } = await sql`
          INSERT INTO trend_keywords (keyword, category, trend_score, source_count, sources, last_updated)
          VALUES (${kw.keyword}, ${kw.category}, ${kw.trend_score}, ${
            kw.sourceCounts.hn + kw.sourceCounts.github + kw.sourceCounts.trends
          }, ${JSON.stringify(sources)}, NOW())
          ON CONFLICT DO NOTHING
          RETURNING id
        `

        let keywordId: number
        if (kwRows.length > 0) {
          keywordId = kwRows[0].id
        } else {
          const { rows } = await sql`
            SELECT id FROM trend_keywords WHERE keyword = ${kw.keyword}
          `
          if (rows.length === 0) continue
          keywordId = rows[0].id

          // Update score
          await sql`
            UPDATE trend_keywords
            SET trend_score = ${kw.trend_score}, last_updated = NOW()
            WHERE id = ${keywordId}
          `
        }

        // Step 5: Generate domain candidates
        const sourceNames = []
        if (kw.sourceCounts.hn > 0) sourceNames.push('HN')
        if (kw.sourceCounts.github > 0) sourceNames.push('GitHub')
        if (kw.sourceCounts.trends > 0) sourceNames.push('Google Trends')

        const candidates = await generateDomainCandidates(
          kw.keyword,
          kw.trend_score,
          sourceNames,
          kw.category
        )

        if (candidates.length === 0) continue

        // Step 6: Check availability
        const domainNames = candidates.map((c) => c.domain)
        const availabilityMap = await bulkCheckAvailability(domainNames)

        // Step 7: Store domain suggestions
        for (const candidate of candidates) {
          const avail = availabilityMap.get(candidate.domain)
          const tld = candidate.domain.split('.').slice(1).join('.')
          const purchaseUrl = getAffiliateLink(candidate.domain)

          try {
            await sql`
              INSERT INTO domain_suggestions
                (domain, tld, keyword_id, reasoning, is_available, purchase_url, price_usd, availability_checked_at)
              VALUES
                (${candidate.domain}, ${tld}, ${keywordId}, ${candidate.reasoning},
                 ${avail?.available ?? false}, ${purchaseUrl}, ${avail?.price ?? null}, NOW())
              ON CONFLICT (domain) DO UPDATE SET
                is_available = EXCLUDED.is_available,
                price_usd = EXCLUDED.price_usd,
                availability_checked_at = NOW()
            `
          } catch (dbErr) {
            log.push(`DB insert error for ${candidate.domain}: ${dbErr}`)
          }
        }

        log.push(`Processed keyword "${kw.keyword}": ${candidates.length} domains generated`)
      } catch (kwErr) {
        log.push(`Error processing keyword "${kw.keyword}": ${kwErr}`)
      }
    }

    // Step 8: Invalidate trending cache
    await invalidateCache('feed:trending')
    log.push('Cache invalidated')

    return NextResponse.json({ success: true, log })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.push(`Fatal error: ${message}`)
    console.error('/api/cron/fetch-trends error:', error)
    return NextResponse.json({ success: false, log, error: message }, { status: 500 })
  }
}
