import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import { checkDomainAvailability } from '@/lib/domain/availability'
import { invalidateCache } from '@/lib/cache/redis'

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
  let checked = 0
  let markedUnavailable = 0

  try {
    log.push('Starting availability re-check...')

    // Fetch domains marked available in the last 7 days
    const { rows: domains } = await sql`
      SELECT id, domain
      FROM domain_suggestions
      WHERE is_available = true
        AND (availability_checked_at IS NULL
          OR availability_checked_at > NOW() - INTERVAL '7 days')
      ORDER BY availability_checked_at ASC NULLS FIRST
      LIMIT 100
    `

    log.push(`Found ${domains.length} domains to re-check`)

    // Check in batches of 5
    const batchSize = 5
    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (rawRow) => {
          const row = rawRow as { id: number; domain: string }
          try {
            const result = await checkDomainAvailability(row.domain)
            checked++

            if (!result.available) {
              // Domain has been taken — update record
              await sql`
                UPDATE domain_suggestions
                SET is_available = false,
                    availability_checked_at = NOW()
                WHERE id = ${row.id}
              `
              markedUnavailable++
              log.push(`${row.domain} is now TAKEN`)
            } else {
              // Still available — update checked timestamp and price
              await sql`
                UPDATE domain_suggestions
                SET availability_checked_at = NOW(),
                    price_usd = ${result.price ?? null}
                WHERE id = ${row.id}
              `
            }
          } catch (err) {
            log.push(`Error checking ${row.domain}: ${err}`)
          }
        })
      )

      // Small delay between batches to respect rate limits
      if (i + batchSize < domains.length) {
        await new Promise((r) => setTimeout(r, 500))
      }
    }

    // Invalidate cache if any domains changed status
    if (markedUnavailable > 0) {
      await invalidateCache('feed:trending')
      log.push('Trending cache invalidated due to status changes')
    }

    log.push(`Done. Checked: ${checked}, Marked unavailable: ${markedUnavailable}`)

    return NextResponse.json({
      success: true,
      checked,
      markedUnavailable,
      log,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.push(`Fatal error: ${message}`)
    console.error('/api/cron/check-availability error:', error)
    return NextResponse.json(
      { success: false, checked, markedUnavailable, log, error: message },
      { status: 500 }
    )
  }
}
