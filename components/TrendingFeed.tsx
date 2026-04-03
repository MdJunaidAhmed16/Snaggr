'use client'

import { useEffect, useState, useCallback } from 'react'
import DomainCard, { DomainCardProps } from './DomainCard'
import { clsx } from 'clsx'

interface TrendingDomain {
  id: number
  domain: string
  tld: string
  keyword: string
  category: string
  trend_score: number
  sources: Record<string, number> | null
  reasoning: string
  is_available: boolean
  purchase_url: string | null
  price_usd: number | null
  created_at: string
  views_today: number
}

const CATEGORIES = ['All', 'AI/ML', 'SaaS', 'Fintech', 'Dev Tools', 'Other']

const PRICE_FILTERS = [
  { label: 'Any price', value: 0 },
  { label: 'Under $15', value: 15 },
  { label: 'Under $25', value: 25 },
  { label: 'Under $50', value: 50 },
]

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
      <div className="flex items-start justify-between">
        <div className="h-7 w-40 rounded-md bg-[#1e1e1e]" />
        <div className="h-5 w-16 rounded-full bg-[#1e1e1e]" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full rounded bg-[#1e1e1e]" />
        <div className="h-4 w-4/5 rounded bg-[#1e1e1e]" />
      </div>
      <div className="mt-4 h-4 w-24 rounded-full bg-[#1e1e1e]" />
      <div className="mt-4 flex gap-2">
        <div className="h-9 w-20 rounded-lg bg-[#1e1e1e]" />
        <div className="h-9 flex-1 rounded-lg bg-[#1e1e1e]" />
      </div>
    </div>
  )
}

export default function TrendingFeed() {
  const [domains, setDomains] = useState<TrendingDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMock, setIsMock] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [maxPrice, setMaxPrice] = useState(0)

  const fetchDomains = useCallback(async (category: string, price: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '30' })
      if (category !== 'All') params.set('category', category)
      if (price > 0) params.set('max_price', String(price))

      const res = await fetch(`/api/trending-domains?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setDomains(data.domains ?? [])
      setIsMock(!!data.mock)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending domains')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDomains(activeCategory, maxPrice)
  }, [activeCategory, maxPrice, fetchDomains])

  return (
    <div className="space-y-5">
      {/* Demo banner */}
      {isMock && !loading && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
          <span>⚠️</span>
          <span>
            <strong>Demo mode</strong> — showing sample data. Connect the DB and run the pipeline to see real trend-driven domains with verified availability.
          </span>
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* Category */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150',
                activeCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222222] hover:text-white'
              )}
              aria-pressed={activeCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden h-5 w-px bg-[#2a2a2a] sm:block" />

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Price:</span>
          <div className="flex gap-1.5" role="group" aria-label="Filter by price">
            {PRICE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setMaxPrice(f.value)}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150',
                  maxPrice === f.value
                    ? 'bg-green-600 text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222222] hover:text-white'
                )}
                aria-pressed={maxPrice === f.value}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result count */}
      {!loading && !error && (
        <p className="text-xs text-gray-600">
          {domains.length} domain{domains.length !== 1 ? 's' : ''} found
          {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
          {maxPrice > 0 ? ` under $${maxPrice}` : ''}
        </p>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => fetchDomains(activeCategory, maxPrice)}
            className="mt-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
          >
            Retry
          </button>
        </div>
      )}

      {/* Domain grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
          : domains.map((d) => {
              const props: DomainCardProps = {
                domain: d.domain,
                available: d.is_available,
                price_usd: d.price_usd,
                purchase_url: d.purchase_url ?? `https://www.namecheap.com/domains/registration/results/?domain=${d.domain}`,
                trend_keyword: d.keyword,
                trend_score: d.trend_score,
                sources: d.sources,
                reasoning: d.reasoning,
                views_today: d.views_today,
                heat: d.trend_score,
                is_mock: isMock,
              }
              return <DomainCard key={d.id} {...props} />
            })}
      </div>

      {/* Empty state */}
      {!loading && !error && domains.length === 0 && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-12 text-center">
          <p className="text-2xl">🔍</p>
          <p className="mt-2 text-gray-400">No domains match your filters.</p>
          <button
            onClick={() => { setActiveCategory('All'); setMaxPrice(0) }}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
