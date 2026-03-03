import Link from 'next/link'
import { Shield, CreditCard, Headphones, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'A propos | FinSoft',
  description: "L'equipe FinSoft - Un projet ne a l'IAE Dijon pour moderniser la comptabilite des cabinets francais.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar minimal */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FS</span>
            </div>
            <span className="font-bold text-xl text-slate-900">FinSoft</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Accueil
            </Link>
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Se connecter
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">
            L&apos;equipe FinSoft
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            Un projet ne a l&apos;IAE Dijon, construit pour moderniser
            la comptabilite des cabinets francais.
          </p>
        </div>
      </section>

      {/* Notre histoire */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Notre histoire</h2>
          <p className="text-slate-600 leading-relaxed">
            FinSoft est ne d&apos;un constat simple : les cabinets comptables francais
            meritent un outil moderne, abordable et pense pour leur realite quotidienne.
            Developpe par des etudiants en Finance de l&apos;IAE Dijon avec le soutien
            du corps enseignant, FinSoft integre les retours de praticiens du metier
            depuis sa conception.
          </p>
        </div>
      </section>

      {/* Structure & transparence */}
      <section className="py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Structure &amp; transparence</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              FinSoft est un projet dont le statut juridique est en cours de definition.
              Fonde en 2026 par des etudiants de l&apos;IAE Dijon — Ecole Universitaire
              de Management. Contact : contact@finsoft.app
            </p>
          </div>
        </div>
      </section>

      {/* Vos donnees vous appartiennent */}
      <section className="py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-emerald-800 mb-3">Vos donnees vous appartiennent</h3>
            <p className="text-emerald-700 text-sm leading-relaxed">
              Export FEC et CSV disponible a tout moment depuis vos parametres.
              En cas d&apos;arret du service : preavis de 6 mois et export complet
              de toutes vos donnees garanti. Aucun enfermement proprietaire.
            </p>
          </div>
        </div>
      </section>

      {/* Nos engagements */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Nos engagements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
              <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
              <p className="text-sm text-slate-700 font-medium leading-relaxed">
                Donnees hebergees en Europe (AWS EU) &middot; Conformite RGPD by design
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
              <CreditCard className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
              <p className="text-sm text-slate-700 font-medium leading-relaxed">
                Prix transparents &middot; Pas de frais caches &middot; Resiliable a tout moment
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
              <Headphones className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
              <p className="text-sm text-slate-700 font-medium leading-relaxed">
                Support direct fondateurs &middot; Reponse &lt; 24h
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-slate-600 mb-6 leading-relaxed">
            Vous etes expert-comptable et voulez tester FinSoft en avant-premiere ?
            Contactez-nous directement.
          </p>
          <a
            href="mailto:contact@finsoft.app"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Nous ecrire
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center text-xs">
        <p>&copy; 2026 FinSoft &middot; Concu a l&apos;IAE Dijon &middot; contact@finsoft.app</p>
      </footer>
    </div>
  )
}
