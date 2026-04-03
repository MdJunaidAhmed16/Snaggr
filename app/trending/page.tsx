import type { Metadata } from 'next'
import TrendingFeed from '@/components/TrendingFeed'

export const metadata: Metadata = {
  title: 'Trending Domains — Snaggr',
  description:
    'Domains generated from live trend signals across HN, GitHub, and Google Trends. Buy before the herd shows up.',
}

export default function TrendingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3 py-1 text-xs text-indigo-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
          Updated every 2 hours
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          What's About to Blow Up
        </h1>
        <p className="mt-3 max-w-2xl text-gray-400">
          Domains generated from live trend signals across HN, GitHub, and Google.
          These keywords are rising — the domains are still available.
        </p>
      </div>

      <TrendingFeed />
    </div>
  )
}
