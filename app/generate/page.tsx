import type { Metadata } from 'next'
import IdeaGenerator from '@/components/IdeaGenerator'

export const metadata: Metadata = {
  title: 'Name My Startup — Snaggr',
  description:
    'Describe your business idea and get brandable domain name suggestions instantly. AI-powered, availability-checked.',
}

export default function GeneratePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-xs text-amber-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          AI-powered naming
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          Name My Startup
        </h1>
        <p className="mt-3 max-w-2xl text-gray-400">
          Describe your business idea and we&apos;ll generate brandable domain names tailored to
          your vision — then check availability instantly.
        </p>
      </div>

      <IdeaGenerator />
    </div>
  )
}
