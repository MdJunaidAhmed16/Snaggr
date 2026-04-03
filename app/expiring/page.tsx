import type { Metadata } from 'next'
import ExpiringFeed from '@/components/ExpiringFeed'

export const metadata: Metadata = {
  title: 'Expiring Domains — Snaggr',
  description:
    'High-value domains expiring soon. Real backlinks, real history. Grab them before they drop.',
}

export default function ExpiringPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1 text-xs text-red-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
          Updated daily
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          Grab Before They&apos;re Gone
        </h1>
        <p className="mt-3 max-w-2xl text-gray-400">
          High-value domains expiring soon. Real backlinks, real history. Someone built something
          real here — now it&apos;s your turn.
        </p>
      </div>

      <ExpiringFeed />
    </div>
  )
}
