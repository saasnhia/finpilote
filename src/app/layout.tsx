import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Worthifast — Comptabilité automatisée. En local.',
  description: 'SaaS comptable local RGPD. OCR factures, TVA, rapprochement bancaire. Dès 299€.',
  keywords: ['comptabilité', 'OCR factures', 'SIREN', 'TVA intracommunautaire', 'VIES', 'rapprochement bancaire', 'PME', 'cabinet comptable', 'RGPD', 'Dijon'],
  authors: [{ name: 'Worthifast' }],
  icons: {
    icon: '/favicon.svg',
    apple: '/logo-icon.svg',
  },
  openGraph: {
    title: 'Worthifast — Comptabilité automatisée. En local.',
    description: 'SaaS comptable local RGPD. OCR factures, TVA, rapprochement bancaire. Dès 299€.',
    type: 'website',
    locale: 'fr_FR',
    images: ['/logo.svg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="font-body antialiased">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        {children}
      </body>
    </html>
  )
}
