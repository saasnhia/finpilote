import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Conditions Generales de Vente | Worthifast',
}

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Worthifast" width={140} height={34} className="h-8 w-auto" />
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-10">Conditions Generales de Vente</h1>

        <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Objet</h2>
            <p>
              Les presentes CGV regissent l&apos;utilisation du service Worthifast,
              logiciel SaaS de comptabilite accessible sur worthifast.app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Editeur du service</h2>
            <p>
              Worthifast — Projet en cours d&apos;immatriculation, fonde en 2026.
              Contact : contact@worthifast.app
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Description du service</h2>
            <p>
              Worthifast est un logiciel de comptabilite en ligne (SaaS) destine
              aux cabinets d&apos;expertise comptable, independants et TPE/PME francaises.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Tarifs</h2>
            <p>
              Les tarifs sont affiches HT sur la page de tarification.
              La TVA applicable est celle en vigueur en France (20%).
              Les abonnements sont factures mensuellement ou annuellement
              selon le choix effectue lors de la souscription.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Essai gratuit</h2>
            <p>
              Un essai gratuit de 30 jours est propose sans carte bancaire requise.
              A l&apos;issue de la periode d&apos;essai, l&apos;acces est suspendu sauf souscription
              a un abonnement payant.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Resiliation</h2>
            <p>
              L&apos;abonnement est resiliable a tout moment depuis les parametres du compte.
              La resiliation prend effet a la fin de la periode de facturation en cours.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Donnees et reversibilite</h2>
            <p>
              L&apos;utilisateur peut exporter ses donnees (FEC, CSV) a tout moment.
              En cas d&apos;arret du service, un preavis de 6 mois est garanti avec
              export complet de toutes les donnees.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Droit applicable</h2>
            <p>
              Les presentes CGV sont soumises au droit francais.
              Tout litige releve de la competence des tribunaux francais.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-xs text-slate-400 text-center">
          <p>Derniere mise a jour : mars 2026</p>
          <Link href="/" className="text-emerald-500 hover:underline mt-2 inline-block">Retour a l&apos;accueil</Link>
        </div>
      </div>
    </div>
  )
}
