import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AlloyWatch — Aerospace Materials Lead Time Intelligence',
  description: 'Real-time lead time tracking, commodity prices, and supply disruption alerts for aerospace exotic materials.',
  openGraph: {
    title: 'AlloyWatch',
    description: 'Bloomberg for aerospace materials. Know before your supply chain breaks.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
