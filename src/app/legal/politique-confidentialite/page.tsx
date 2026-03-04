import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Politique de Confidentialite | Worthifast',
}

export default function PolitiqueConfidentialitePage() {
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
        <h1 className="text-3xl font-extrabold text-slate-900 mb-10">Politique de Confidentialite</h1>

        <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Responsable du traitement</h2>
            <p>Worthifast — contact@worthifast.app</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Donnees collectees</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Donnees d&apos;identification : nom, prenom, adresse email</li>
              <li>Donnees professionnelles : nom du cabinet, SIREN</li>
              <li>Donnees comptables : transactions, factures, declarations TVA</li>
              <li>Donnees techniques : logs de connexion, adresse IP</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Finalites du traitement</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Fourniture du service de comptabilite</li>
              <li>Envoi d&apos;emails transactionnels (verification, notifications)</li>
              <li>Amelioration du service</li>
              <li>Conformite legale et fiscale</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Base legale</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Execution du contrat (fourniture du service)</li>
              <li>Obligation legale (conservation comptable 10 ans)</li>
              <li>Interet legitime (amelioration du service)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Hebergement et transfert</h2>
            <p>
              Les donnees sont hebergees sur des serveurs situes en Europe (AWS EU).
              Aucun transfert hors UE sans garanties appropriees.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Duree de conservation</h2>
            <p>
              Donnees de compte : duree de l&apos;abonnement + 3 ans apres resiliation.
              Donnees comptables : 10 ans (obligation legale francaise).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Droits des utilisateurs</h2>
            <p>
              Conformement au RGPD, vous disposez des droits d&apos;acces, rectification,
              suppression, portabilite et opposition.
              Exercez vos droits : contact@worthifast.app
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Cookies</h2>
            <p>
              Worthifast utilise uniquement des cookies strictement necessaires
              au fonctionnement du service (session, authentification).
              Aucun cookie publicitaire ou de tracking tiers.
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
