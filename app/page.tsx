import Link from 'next/link'

const features = [
  {
    emoji: '🔮',
    title: 'Trending Domains',
    subtitle: "What's about to blow up",
    description:
      'Domains generated from live trend signals across HN, GitHub, and Google. Buy before the herd shows up.',
    href: '/trending',
    accent: 'from-indigo-500/20 to-purple-500/10',
    borderHover: 'hover:border-indigo-500/40',
    badge: 'Live signals',
    badgeColor: 'bg-indigo-500/10 text-indigo-400',
  },
  {
    emoji: '💡',
    title: 'Name My Startup',
    subtitle: 'Describe your idea',
    description:
      "Tell us what you're building. Claude generates brandable domain names tailored to your business, then checks availability instantly.",
    href: '/generate',
    accent: 'from-amber-500/20 to-orange-500/10',
    borderHover: 'hover:border-amber-500/40',
    badge: 'AI-powered',
    badgeColor: 'bg-amber-500/10 text-amber-400',
  },
  {
    emoji: '⏰',
    title: 'Expiring Domains',
    subtitle: "Grab before they're gone",
    description:
      "High-value domains dropping soon. Real backlinks, real history. Someone built something real here \u2014 now it's your turn.",
    href: '/expiring',
    accent: 'from-red-500/20 to-rose-500/10',
    borderHover: 'hover:border-red-500/40',
    badge: 'Time-sensitive',
    badgeColor: 'bg-red-500/10 text-red-400',
  },
]

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-sm text-indigo-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
          Trend signals updated every 2 hours
        </div>

        <h1 className="mt-6 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
          Domain Intelligence,{' '}
          <span className="text-gradient">Unhinged.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
          Stop guessing. Buy domains backed by real trend data from Hacker News,
          GitHub, and Google Trends — before everyone else figures it out.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border border-[#2a2a2a] bg-gradient-to-br ${f.accent} p-8 transition-all duration-300 ${f.borderHover} hover:-translate-y-1 hover:shadow-2xl`}
          >
            {/* Badge */}
            <span
              className={`mb-6 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium ${f.badgeColor}`}
            >
              {f.badge}
            </span>

            {/* Icon */}
            <span className="text-5xl" aria-hidden="true">
              {f.emoji}
            </span>

            {/* Content */}
            <div className="mt-6 flex-1">
              <h2 className="text-2xl font-bold text-white">{f.title}</h2>
              <p className="mt-1 text-sm font-medium text-gray-400">{f.subtitle}</p>
              <p className="mt-4 text-sm leading-relaxed text-gray-500">
                {f.description}
              </p>
            </div>

            {/* CTA */}
            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-white">
              <span>Explore</span>
              <span
                className="transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Social proof / stats strip */}
      <div className="mt-20 grid grid-cols-2 gap-6 rounded-2xl border border-[#1a1a1a] bg-[#111111] p-8 sm:grid-cols-4">
        {[
          { value: '20+', label: 'Fresh picks daily' },
          { value: '5', label: 'Signal sources' },
          { value: '2hr', label: 'Refresh cycle' },
          { value: '0', label: 'Guesswork' },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-3xl font-black text-white">{stat.value}</p>
            <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
