'use client'

import { useEffect, useState, useCallback } from 'react'
import { clsx } from 'clsx'

interface ExpiringDomain {
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

const EXPIRY_FILTERS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
]

function ExpiryCountdown({ days }: { days: number }) {
  const isUrgent = days <= 7
  const isSoon = days <= 30

  return (
    <div
      className={clsx(
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium',
        isUrgent
          ? 'bg-red-500/10 text-red-400'
          : isSoon
          ? 'bg-amber-500/10 text-amber-400'
          : 'bg-gray-500/10 text-gray-400'
      )}
    >
      <span aria-hidden="true">⏰</span>
      <span>
        {days <= 0
          ? 'Expired'
          : days === 1
          ? 'Expires tomorrow'
          : `${days} days left`}
      </span>
    </div>
  )
}

function ExpiringDomainCard({ d }: { d: ExpiringDomain }) {
  return (
    <div className="group flex flex-col gap-4 rounded-xl border border-[#2a2a2a] bg-[#111111] p-5 transition-all duration-200 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">{d.domain}</h3>
          {d.has_active_business && (
            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-emerald-400">
              <span aria-hidden="true">✓</span> Active business
            </span>
          )}
        </div>
        <ExpiryCountdown days={d.days_until_expiry} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[#0a0a0a] p-3 text-center">
          <p className="text-lg font-bold text-white">
            {d.backlink_count.toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-500">Backlinks</p>
        </div>
        <div className="rounded-lg bg-[#0a0a0a] p-3 text-center">
          <p className="text-lg font-bold text-white">{d.domain_age_years}yr</p>
          <p className="text-[11px] text-gray-500">Domain Age</p>
        </div>
        <div className="rounded-lg bg-[#0a0a0a] p-3 text-center">
          <p className="text-lg font-bold text-indigo-400">{d.score.toFixed(0)}</p>
          <p className="text-[11px] text-gray-500">Score</p>
        </div>
      </div>

      {/* Registrar */}
      <p className="text-xs text-gray-600">
        Registered with{' '}
        <span className="text-gray-400">{d.registrar}</span>
      </p>

      {/* CTA */}
      <a
        href={d.purchase_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 active:bg-indigo-700"
      >
        Grab It →
      </a>

      {/* FOMO */}
      <p className="border-t border-[#1e1e1e] pt-3 text-center text-[11px] italic text-gray-600">
        This domain drops in {d.days_until_expiry} days. It won't wait.
      </p>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-[#2a2a2a] bg-[#111111] p-5">
      <div className="flex items-start justify-between">
        <div className="h-7 w-36 rounded-md bg-[#1e1e1e]" />
        <div className="h-8 w-24 rounded-lg bg-[#1e1e1e]" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-[#1e1e1e]" />
        ))}
      </div>
      <div className="mt-4 h-10 rounded-lg bg-[#1e1e1e]" />
    </div>
  )
}

export default function ExpiringFeed() {
  const [domains, setDomains] = useState<ExpiringDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expiresWithin, setExpiresWithin] = useState(90)

  const fetchDomains = useCallback(async (days: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        expires_within_days: String(days),
        limit: '20',
      })
      const res = await fetch(`/api/expiring-domains?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setDomains(data.domains ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expiring domains')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDomains(expiresWithin)
  }, [expiresWithin, fetchDomains])

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-400">Expires within:</span>
        <div className="flex gap-2" role="group" aria-label="Expiry filter">
          {EXPIRY_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setExpiresWithin(f.value)}
              className={clsx(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150',
                expiresWithin === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222222] hover:text-white'
              )}
              aria-pressed={expiresWithin === f.value}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => fetchDomains(expiresWithin)}
            className="mt-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
          >
            Retry
          </button>
        </div>
      )}

      {/* Domain grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : domains.map((d) => <ExpiringDomainCard key={d.id} d={d} />)}
      </div>

      {/* Empty state */}
      {!loading && !error && domains.length === 0 && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-12 text-center">
          <p className="text-2xl">🎉</p>
          <p className="mt-2 text-gray-400">
            No domains expiring in the next {expiresWithin} days.
          </p>
          <button
            onClick={() => setExpiresWithin(90)}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Check 90 days
          </button>
        </div>
      )}
    </div>
  )
}
