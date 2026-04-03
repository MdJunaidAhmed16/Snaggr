import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import { getCachedFeed, setCachedFeed } from '@/lib/cache/redis'
import { getAffiliateLink } from '@/lib/domain/affiliate'

export interface ExpiringDomainRecord {
  id: number
  domain: string
  expiry_date: string
  backlink_count: number
  domain_age_years: number
  registrar: string
  has_active_business: boolean
  score: number
  days_until_expiry: number
  purchase_url: string
}

const CACHE_KEY = 'feed:expiring'
const CACHE_TTL = 21600 // 6 hours

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const minBacklinks = parseInt(searchParams.get('min_backlinks') ?? '0', 10)
    const expiresWithinDays = parseInt(searchParams.get('expires_within_days') ?? '90', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)

    const isDefaultParams =
      minBacklinks === 0 && expiresWithinDays === 90 && limit === 20

    // Check cache for default params
    if (isDefaultParams) {
      const cached = await getCachedFeed<ExpiringDomainRecord[]>(CACHE_KEY)
      if (cached) {
        return NextResponse.json({ domains: cached, cached: true })
      }
    }

    // Try to query the database
    try {
      const { rows } = await sql`
        SELECT
          id,
          domain,
          expiry_date::text,
          backlink_count,
          domain_age_years,
          registrar,
          has_active_business,
          score,
          EXTRACT(DAY FROM (expiry_date - CURRENT_DATE))::int AS days_until_expiry
        FROM expiring_domains
        WHERE
          backlink_count >= ${minBacklinks}
          AND expiry_date <= CURRENT_DATE + INTERVAL '1 day' * ${expiresWithinDays}
          AND expiry_date >= CURRENT_DATE
        ORDER BY score DESC, expiry_date ASC
        LIMIT ${limit}
      `

      const domains: ExpiringDomainRecord[] = rows.map((row) => ({
        ...(row as unknown as Omit<ExpiringDomainRecord, 'purchase_url'>),
        purchase_url: getAffiliateLink(row.domain as string),
      }))

      if (isDefaultParams && domains.length > 0) {
        await setCachedFeed(CACHE_KEY, domains, CACHE_TTL)
      }

      // Fall back to mock if no data in DB
      if (domains.length === 0) {
        return NextResponse.json({ domains: getMockExpiringDomains(expiresWithinDays), cached: false, mock: true })
      }

      return NextResponse.json({ domains, cached: false })
    } catch {
      // DB not set up — return mock data
      return NextResponse.json({ domains: getMockExpiringDomains(expiresWithinDays), cached: false, mock: true })
    }
  } catch (error) {
    console.error('/api/expiring-domains error:', error)
    return NextResponse.json({ domains: getMockExpiringDomains(90), cached: false, mock: true })
  }
}

function getMockExpiringDomains(withinDays: number): ExpiringDomainRecord[] {
  const now = new Date()
  const addDays = (days: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  }

  const all: ExpiringDomainRecord[] = [
    { id: 1,  domain: 'cloudpivot.io',      expiry_date: addDays(2),  backlink_count: 1247, domain_age_years: 6,  registrar: 'GoDaddy',        has_active_business: true,  score: 94.1, days_until_expiry: 2,  purchase_url: getAffiliateLink('cloudpivot.io') },
    { id: 2,  domain: 'stackbloomhq.dev',   expiry_date: addDays(4),  backlink_count: 834,  domain_age_years: 4,  registrar: 'Namecheap',      has_active_business: false, score: 85.1, days_until_expiry: 4,  purchase_url: getAffiliateLink('stackbloomhq.dev') },
    { id: 3,  domain: 'launchpadai.co',      expiry_date: addDays(5),  backlink_count: 3210, domain_age_years: 3,  registrar: 'GoDaddy',        has_active_business: true,  score: 91.6, days_until_expiry: 5,  purchase_url: getAffiliateLink('launchpadai.co') },
    { id: 4,  domain: 'aiworkflowx.co',     expiry_date: addDays(7),  backlink_count: 2103, domain_age_years: 3,  registrar: 'Google Domains', has_active_business: true,  score: 88.7, days_until_expiry: 7,  purchase_url: getAffiliateLink('aiworkflowx.co') },
    { id: 5,  domain: 'devkitr.com',         expiry_date: addDays(9),  backlink_count: 567,  domain_age_years: 5,  registrar: 'Namecheap',      has_active_business: false, score: 71.4, days_until_expiry: 9,  purchase_url: getAffiliateLink('devkitr.com') },
    { id: 6,  domain: 'infrahub.dev',        expiry_date: addDays(11), backlink_count: 1892, domain_age_years: 4,  registrar: 'Cloudflare',     has_active_business: true,  score: 87.3, days_until_expiry: 11, purchase_url: getAffiliateLink('infrahub.dev') },
    { id: 7,  domain: 'webhookr.com',        expiry_date: addDays(14), backlink_count: 445,  domain_age_years: 8,  registrar: 'Namecheap',      has_active_business: false, score: 72.3, days_until_expiry: 14, purchase_url: getAffiliateLink('webhookr.com') },
    { id: 8,  domain: 'apigateway.dev',      expiry_date: addDays(16), backlink_count: 4123, domain_age_years: 7,  registrar: 'GoDaddy',        has_active_business: true,  score: 96.2, days_until_expiry: 16, purchase_url: getAffiliateLink('apigateway.dev') },
    { id: 9,  domain: 'mintpaymentsapp.io',  expiry_date: addDays(19), backlink_count: 2891, domain_age_years: 5,  registrar: 'GoDaddy',        has_active_business: true,  score: 93.4, days_until_expiry: 19, purchase_url: getAffiliateLink('mintpaymentsapp.io') },
    { id: 10, domain: 'saaspulse.co',        expiry_date: addDays(22), backlink_count: 712,  domain_age_years: 3,  registrar: 'Namecheap',      has_active_business: false, score: 75.8, days_until_expiry: 22, purchase_url: getAffiliateLink('saaspulse.co') },
    { id: 11, domain: 'codeflarex.dev',      expiry_date: addDays(25), backlink_count: 678,  domain_age_years: 2,  registrar: 'Cloudflare',     has_active_business: false, score: 68.9, days_until_expiry: 25, purchase_url: getAffiliateLink('codeflarex.dev') },
    { id: 12, domain: 'growthloopx.io',      expiry_date: addDays(28), backlink_count: 1345, domain_age_years: 4,  registrar: 'GoDaddy',        has_active_business: true,  score: 84.2, days_until_expiry: 28, purchase_url: getAffiliateLink('growthloopx.io') },
    { id: 13, domain: 'shipfastly.ai',       expiry_date: addDays(31), backlink_count: 1567, domain_age_years: 1,  registrar: 'Namecheap',      has_active_business: true,  score: 83.4, days_until_expiry: 31, purchase_url: getAffiliateLink('shipfastly.ai') },
    { id: 14, domain: 'pipelinehq.dev',      expiry_date: addDays(34), backlink_count: 934,  domain_age_years: 6,  registrar: 'GoDaddy',        has_active_business: false, score: 79.1, days_until_expiry: 34, purchase_url: getAffiliateLink('pipelinehq.dev') },
    { id: 15, domain: 'devpulse.io',         expiry_date: addDays(38), backlink_count: 921,  domain_age_years: 7,  registrar: 'GoDaddy',        has_active_business: false, score: 76.6, days_until_expiry: 38, purchase_url: getAffiliateLink('devpulse.io') },
    { id: 16, domain: 'cleardeployment.co',  expiry_date: addDays(42), backlink_count: 488,  domain_age_years: 3,  registrar: 'Namecheap',      has_active_business: false, score: 63.4, days_until_expiry: 42, purchase_url: getAffiliateLink('cleardeployment.co') },
    { id: 17, domain: 'logrocket.app',       expiry_date: addDays(47), backlink_count: 5621, domain_age_years: 9,  registrar: 'GoDaddy',        has_active_business: true,  score: 97.8, days_until_expiry: 47, purchase_url: getAffiliateLink('logrocket.app') },
    { id: 18, domain: 'startupstackx.io',    expiry_date: addDays(53), backlink_count: 1102, domain_age_years: 5,  registrar: 'Cloudflare',     has_active_business: true,  score: 81.3, days_until_expiry: 53, purchase_url: getAffiliateLink('startupstackx.io') },
    { id: 19, domain: 'buildkitpro.dev',     expiry_date: addDays(61), backlink_count: 743,  domain_age_years: 4,  registrar: 'Namecheap',      has_active_business: false, score: 73.9, days_until_expiry: 61, purchase_url: getAffiliateLink('buildkitpro.dev') },
    { id: 20, domain: 'mlflowpro.io',        expiry_date: addDays(68), backlink_count: 2341, domain_age_years: 2,  registrar: 'GoDaddy',        has_active_business: true,  score: 89.7, days_until_expiry: 68, purchase_url: getAffiliateLink('mlflowpro.io') },
    { id: 21, domain: 'observehq.dev',       expiry_date: addDays(74), backlink_count: 1678, domain_age_years: 3,  registrar: 'Namecheap',      has_active_business: true,  score: 85.5, days_until_expiry: 74, purchase_url: getAffiliateLink('observehq.dev') },
    { id: 22, domain: 'featureflagx.io',     expiry_date: addDays(81), backlink_count: 892,  domain_age_years: 5,  registrar: 'GoDaddy',        has_active_business: false, score: 77.2, days_until_expiry: 81, purchase_url: getAffiliateLink('featureflagx.io') },
  ]

  return all.filter((d) => d.days_until_expiry <= withinDays)
}
