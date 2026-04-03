import Link from 'next/link'

const navLinks = [
  { href: '/trending', label: 'Trending' },
  { href: '/generate', label: 'Name My Startup' },
  { href: '/expiring', label: 'Expiring' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="group flex flex-col leading-none"
          aria-label="Snaggr home"
        >
          <span className="text-xl font-black tracking-tight text-white transition-colors group-hover:text-indigo-400">
            SNAGGR
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-gray-600 group-hover:text-gray-500">
            Domain Intelligence, Unhinged.
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
