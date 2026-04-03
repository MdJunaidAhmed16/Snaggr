'use client'

import { useState } from 'react'
import DomainCard, { DomainCardProps } from './DomainCard'
import { clsx } from 'clsx'

interface SuggestedDomain {
  domain: string
  reasoning: string
  available: boolean
  price?: number
  purchase_url: string
}

const TLD_OPTIONS = ['.com', '.io', '.dev', '.ai', '.co']

const PRICE_FILTERS = [
  { label: 'Any price', value: 0 },
  { label: 'Under $15', value: 15 },
  { label: 'Under $25', value: 25 },
  { label: 'Under $50', value: 50 },
]

const LOADING_MESSAGES = [
  'Consulting the algorithm...',
  'Checking the vibe...',
  'Running trend analysis...',
  'Synthesizing brand DNA...',
  'Scanning the domain matrix...',
  'Crunching startup potential...',
]

export default function IdeaGenerator() {
  const [idea, setIdea] = useState('')
  const [selectedTlds, setSelectedTlds] = useState<string[]>(['.com', '.io', '.dev'])
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [domains, setDomains] = useState<SuggestedDomain[]>([])
  const [maxPrice, setMaxPrice] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const toggleTld = (tld: string) => {
    setSelectedTlds((prev) =>
      prev.includes(tld) ? prev.filter((t) => t !== tld) : [...prev, tld]
    )
  }

  const handleGenerate = async () => {
    if (!idea.trim()) return
    if (selectedTlds.length === 0) {
      setError('Please select at least one TLD')
      return
    }

    setLoading(true)
    setError(null)
    setDomains([])

    // Cycle loading messages
    let messageIndex = 0
    setLoadingMessage(LOADING_MESSAGES[0])
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length
      setLoadingMessage(LOADING_MESSAGES[messageIndex])
    }, 1800)

    try {
      const res = await fetch('/api/suggest-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim(), tlds: selectedTlds }),
      })

      clearInterval(messageInterval)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }

      const data = await res.json()
      setDomains(data.domains ?? [])
    } catch (err) {
      clearInterval(messageInterval)
      setError(err instanceof Error ? err.message : 'Failed to generate domains')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate()
    }
  }

  return (
    <div className="space-y-8">
      {/* Input form */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-6">
        <div className="space-y-4">
          {/* Textarea */}
          <div>
            <label
              htmlFor="idea-input"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Your Business Idea
            </label>
            <textarea
              id="idea-input"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your business idea... e.g., 'A platform that helps indie developers find beta users for their SaaS products'"
              rows={4}
              maxLength={500}
              className="w-full resize-none rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
              disabled={loading}
            />
            <p className="mt-1 text-right text-xs text-gray-600">
              {idea.length}/500 · Cmd+Enter to generate
            </p>
          </div>

          {/* TLD selector */}
          <div>
            <span className="mb-2 block text-sm font-medium text-gray-300">
              TLDs to include
            </span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Select TLDs">
              {TLD_OPTIONS.map((tld) => (
                <button
                  key={tld}
                  onClick={() => toggleTld(tld)}
                  disabled={loading}
                  className={clsx(
                    'rounded-lg border px-3 py-1.5 text-sm font-mono font-medium transition-all duration-150',
                    selectedTlds.includes(tld)
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                      : 'border-[#2a2a2a] text-gray-500 hover:border-gray-600 hover:text-gray-300'
                  )}
                  aria-pressed={selectedTlds.includes(tld)}
                >
                  {tld}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !idea.trim() || selectedTlds.length === 0}
            className={clsx(
              'w-full rounded-lg py-3 text-sm font-semibold transition-all duration-150',
              loading || !idea.trim() || selectedTlds.length === 0
                ? 'cursor-not-allowed bg-indigo-600/40 text-indigo-400/60'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700'
            )}
          >
            {loading ? loadingMessage : 'Generate Names →'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {domains.length > 0 && (
        <div className="space-y-4">
          {/* Results header + price filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">
              {domains.length} Domain{domains.length !== 1 ? 's' : ''} Generated
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Price:</span>
              <div className="flex gap-1.5">
                {PRICE_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setMaxPrice(f.value)}
                    className={clsx(
                      'rounded-full px-3 py-1 text-xs font-medium transition-all duration-150',
                      maxPrice === f.value
                        ? 'bg-green-600 text-white'
                        : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222222] hover:text-white'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {domains
              .filter((d) => maxPrice === 0 || (d.price != null && d.price <= maxPrice))
              .map((d, i) => {
                const props: DomainCardProps = {
                  domain: d.domain,
                  available: d.available,
                  price_usd: d.price ?? null,
                  purchase_url: d.purchase_url,
                  reasoning: d.reasoning,
                  views_today: Math.floor(Math.random() * 30) + 5,
                  heat: d.available ? 65 + Math.random() * 30 : 20,
                }
                return <DomainCard key={`${d.domain}-${i}`} {...props} />
              })}
          </div>

          {domains.filter((d) => maxPrice === 0 || (d.price != null && d.price <= maxPrice)).length === 0 && (
            <p className="py-6 text-center text-sm text-gray-500">
              No domains under ${maxPrice}.{' '}
              <button onClick={() => setMaxPrice(0)} className="text-indigo-400 hover:underline">
                Show all
              </button>
            </p>
          )}
        </div>
      )}

      {/* Empty results state after generation */}
      {!loading && !error && domains.length === 0 && idea && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] p-12 text-center">
          <p className="text-2xl">🤔</p>
          <p className="mt-2 text-gray-400">
            No available domains found. Try different TLDs or refine your idea.
          </p>
        </div>
      )}
    </div>
  )
}
