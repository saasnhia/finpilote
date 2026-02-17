import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'FinSoft | Pilotez votre rentabilité',
  description: 'Calculez votre seuil de rentabilité en 30 secondes. La solution simple et efficace pour les comptables et PME.',
  keywords: ['comptabilité', 'seuil de rentabilité', 'PME', 'Dijon', 'gestion financière'],
  authors: [{ name: 'FinSoft' }],
  openGraph: {
    title: 'FinSoft | Pilotez votre rentabilité',
    description: 'Calculez votre seuil de rentabilité en 30 secondes.',
    type: 'website',
    locale: 'fr_FR',
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
