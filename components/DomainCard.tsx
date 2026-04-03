'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import FomoSignals from './FomoSignals'

export interface DomainCardProps {
  domain: string
  available: boolean
  price_usd?: number | null
  purchase_url: string
  trend_keyword?: string
  trend_score?: number
  sources?: Record<string, number> | null
  reasoning: string
  views_today: number
  heat: number
  is_mock?: boolean
}

function HeatBadge({ score }: { score: number }) {
  if (score > 70) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-semibold text-orange-400 ring-1 ring-orange-500/30">
        🔥 HOT
      </span>
    )
  }
  if (score >= 40) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/30">
        📈 RISING
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/20 px-2.5 py-0.5 text-xs font-semibold text-gray-400 ring-1 ring-gray-500/30">
      👀 WATCH
    </span>
  )
}

function SourceBadges({ sources }: { sources: Record<string, number> }) {
  const activeSources: string[] = []
  if (sources.hn && sources.hn > 0) activeSources.push('HN')
  if (sources.github && sources.github > 0) activeSources.push('GitHub')
  if (sources.trends && sources.trends > 0) activeSources.push('Google')

  if (activeSources.length === 0) return null

  return (
    <div className="flex items-center gap-1.5">
      {activeSources.map((source) => (
        <span
          key={source}
          className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-medium text-gray-400"
        >
          {source}
        </span>
      ))}
    </div>
  )
}

export default function DomainCard({
  domain,
  available,
  price_usd,
  purchase_url,
  trend_keyword,
  trend_score = 0,
  sources,
  reasoning,
  views_today,
  heat,
  is_mock = false,
}: DomainCardProps) {
  const [saved, setSaved] = useState(false)

  // Build registrar links — Namecheap as primary (shows clean registration page),
  // GoDaddy as secondary. GoDaddy shows "broker" page when domain is taken,
  // which is why we only show it as an alternative.
  const namecheapUrl = `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(domain)}`
  const godaddyUrl = `https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${encodeURIComponent(domain)}&isc=cjcdomsrch`

  const handleSave = () => {
    setSaved((prev) => {
      const next = !prev
      try {
        const key = 'snaggr:saved'
        const existing: string[] = JSON.parse(localStorage.getItem(key) ?? '[]')
        if (next) {
          localStorage.setItem(key, JSON.stringify(Array.from(new Set([...existing, domain]))))
        } else {
          localStorage.setItem(key, JSON.stringify(existing.filter((d) => d !== domain)))
        }
      } catch {
        // ignore storage errors
      }
      return next
    })
  }

  return (
    <div
      className={clsx(
        'group relative flex flex-col gap-4 rounded-xl border bg-[#111111] p-5 transition-all duration-200',
        available
          ? 'border-[#2a2a2a] hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5'
          : 'border-[#2a2a2a] opacity-60'
      )}
    >
      {/* Demo badge */}
      {is_mock && (
        <div className="absolute right-3 top-3 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-500">
          Demo
        </div>
      )}

      {/* Header: domain + heat badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate pr-10 text-xl font-bold tracking-tight text-white">
            {domain}
          </h3>
          {!available && (
            <span className="mt-0.5 text-xs text-red-400">Unavailable</span>
          )}
        </div>
        <HeatBadge score={heat} />
      </div>

      {/* Reasoning */}
      <p className="text-sm leading-relaxed text-gray-400">{reasoning}</p>

      {/* Keyword + score + sources */}
      {trend_keyword && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/20">
            {trend_keyword}
          </span>
          {trend_score > 0 && (
            <span className="text-xs text-gray-500">
              Score: <span className="text-gray-300">{trend_score.toFixed(1)}</span>
            </span>
          )}
          {sources && <SourceBadges sources={sources} />}
        </div>
      )}

      {/* Price + views */}
      <div className="flex items-center gap-3">
        {price_usd != null && available && (
          <span className="text-sm font-semibold text-green-400">
            ${price_usd.toFixed(2)}/yr
          </span>
        )}
        <FomoSignals views={views_today} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          className={clsx(
            'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-150',
            saved
              ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
              : 'border-[#2a2a2a] text-gray-400 hover:border-indigo-500/30 hover:text-indigo-400'
          )}
          aria-label={saved ? 'Remove from saved' : 'Save domain'}
        >
          {saved ? '★ Saved' : '☆ Save'}
        </button>

        {/* Primary CTA — Namecheap (clean registration page, no broker surprises) */}
        <a
          href={available ? namecheapUrl : '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150',
            available
              ? 'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700'
              : 'cursor-not-allowed bg-gray-800 text-gray-500'
          )}
          onClick={available ? undefined : (e) => e.preventDefault()}
        >
          Register →
        </a>
      </div>

      {/* Secondary registrar links */}
      {available && (
        <div className="flex items-center justify-between border-t border-[#1e1e1e] pt-3">
          <span className="text-[11px] text-gray-600">Also check:</span>
          <div className="flex gap-3">
            <a
              href={godaddyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-gray-500 underline-offset-2 hover:text-gray-300 hover:underline"
            >
              GoDaddy
            </a>
            <a
              href={purchase_url !== namecheapUrl ? purchase_url : namecheapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-gray-500 underline-offset-2 hover:text-gray-300 hover:underline"
            >
              Namecheap
            </a>
          </div>
        </div>
      )}

      {/* FOMO tagline (only shown when not demo) */}
      {!is_mock && (
        <p className="text-center text-[11px] italic text-gray-600">
          If you don&apos;t buy this, someone else will.
        </p>
      )}
    </div>
  )
}
