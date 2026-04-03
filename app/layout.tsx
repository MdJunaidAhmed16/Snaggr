import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Snaggr — Domain Intelligence, Unhinged.',
  description:
    'Discover high-value domain names based on real-world trend signals from HN, GitHub, and Google Trends. Name your startup or snag an expiring gem.',
  keywords: ['domain names', 'domain intelligence', 'trending domains', 'startup names', 'expiring domains'],
  openGraph: {
    title: 'Snaggr — Domain Intelligence, Unhinged.',
    description: 'Discover high-value domains before everyone else.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Snaggr — Domain Intelligence, Unhinged.',
    description: 'Discover high-value domains before everyone else.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-[#0a0a0a] text-white antialiased">
        <Header />
        <main>{children}</main>
        <footer className="mt-24 border-t border-[#1a1a1a] py-8 text-center text-sm text-gray-600">
          <p>
            Built with signal, not noise.{' '}
            <span className="text-gray-500">Snaggr © {new Date().getFullYear()}</span>
          </p>
        </footer>
      </body>
    </html>
  )
}
