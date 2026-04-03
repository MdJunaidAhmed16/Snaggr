import { NextRequest, NextResponse } from 'next/server'
import { checkDomainAvailability } from '@/lib/domain/availability'
import { getAffiliateLink } from '@/lib/domain/affiliate'

interface RouteParams {
  params: Promise<{ domain: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { domain: rawDomain } = await params
    const domain = decodeURIComponent(rawDomain).toLowerCase()

    // Strict domain validation: only allow valid domain characters
    const DOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})(\.[a-z]{2,})?$/
    if (!domain || !DOMAIN_REGEX.test(domain) || domain.length > 253) {
      return NextResponse.json(
        { error: 'Invalid domain name' },
        { status: 400 }
      )
    }

    const result = await checkDomainAvailability(domain)

    return NextResponse.json({
      domain,
      available: result.available,
      price: result.price,
      currency: result.currency ?? 'USD',
      purchase_url: getAffiliateLink(domain),
    })
  } catch (error) {
    console.error('/api/domain-check error:', error)
    return NextResponse.json({ error: 'Failed to check domain availability' }, { status: 500 })
  }
}
