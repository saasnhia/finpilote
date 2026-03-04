import Link from 'next/link'

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-emerald-600 hover:underline mb-8 block">← Retour à l&apos;accueil</Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-slate-400 mb-10">Dernière mise à jour : mars 2026</p>

        <div className="space-y-8 text-sm text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Responsable du traitement</h2>
            <p>Worthifast SAS — <a href="mailto:harounchikh71@gmail.com" className="text-emerald-600 hover:underline">harounchikh71@gmail.com</a></p>
            <p className="mt-2 font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              [À COMPLÉTER — Adresse siège social, numéro SIREN, DPO si applicable]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Données collectées</h2>
            <p>Dans le cadre de l&apos;utilisation de Worthifast, nous collectons les catégories de données suivantes :</p>
            <ul className="list-disc list-inside mt-3 space-y-1">
              <li><strong>Données d&apos;identification :</strong> nom, prénom, adresse email professionnelle</li>
              <li><strong>Données comptables :</strong> factures, transactions, données bancaires (relevés importés)</li>
              <li><strong>Données clients :</strong> informations sur vos propres clients (nom, email, SIREN, adresse)</li>
              <li><strong>Données d&apos;usage :</strong> logs de connexion, actions effectuées dans l&apos;application</li>
              <li><strong>Données techniques :</strong> adresse IP, navigateur, système d&apos;exploitation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Finalités du traitement</h2>
            <p>Les données sont traitées pour les finalités suivantes :</p>
            <ul className="list-disc list-inside mt-3 space-y-1">
              <li>Fourniture et amélioration du service Worthifast</li>
              <li>Authentification et sécurisation des accès</li>
              <li>Traitement OCR des documents comptables</li>
              <li>Envoi de notifications et relances (avec votre autorisation)</li>
              <li>Assistance technique et support client</li>
              <li>Respect de nos obligations légales et comptables</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Base légale</h2>
            <p>Le traitement de vos données repose sur :</p>
            <ul className="list-disc list-inside mt-3 space-y-1">
              <li>L&apos;<strong>exécution du contrat</strong> (CGU acceptées lors de l&apos;inscription)</li>
              <li>Notre <strong>intérêt légitime</strong> à améliorer le service</li>
              <li>Le respect de nos <strong>obligations légales</strong></li>
              <li>Votre <strong>consentement explicite</strong> pour les communications marketing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Hébergement et transferts</h2>
            <p>
              Toutes vos données sont hébergées <strong>exclusivement en France</strong> via Supabase (hébergement AWS eu-west-3 — Paris)
              et Vercel (edge network avec données en Europe).
            </p>
            <p className="mt-2">
              <strong>Aucun transfert hors UE</strong> n&apos;est effectué sans votre consentement explicite.
              L&apos;infrastructure est certifiée <strong>ISO 27001</strong> et conforme aux exigences <strong>HDS</strong> (Hébergement de Données de Santé).
            </p>
            <p className="mt-2 font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              [À VÉRIFIER — Confirmer les certifications HDS auprès des prestataires d&apos;hébergement]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Durée de conservation</h2>
            <ul className="list-disc list-inside mt-3 space-y-1">
              <li><strong>Données comptables :</strong> 10 ans (obligation légale)</li>
              <li><strong>Données de compte :</strong> durée de la relation contractuelle + 3 ans</li>
              <li><strong>Logs techniques :</strong> 12 mois</li>
              <li><strong>Données supprimées :</strong> effacement sous 30 jours après votre demande</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Vos droits (RGPD)</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside mt-3 space-y-1">
              <li><strong>Accès :</strong> obtenir une copie de vos données</li>
              <li><strong>Rectification :</strong> corriger des données inexactes</li>
              <li><strong>Effacement :</strong> suppression de votre compte et données associées</li>
              <li><strong>Portabilité :</strong> export de vos données dans un format standard</li>
              <li><strong>Opposition :</strong> s&apos;opposer à certains traitements</li>
              <li><strong>Limitation :</strong> restreindre temporairement le traitement</li>
            </ul>
            <p className="mt-3">Pour exercer ces droits : <a href="mailto:harounchikh71@gmail.com" className="text-emerald-600 hover:underline">harounchikh71@gmail.com</a></p>
            <p className="mt-2">En cas de désaccord, vous pouvez saisir la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">CNIL</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Cookies</h2>
            <p>Worthifast utilise des cookies strictement nécessaires au fonctionnement de l&apos;application (session d&apos;authentification). Aucun cookie de tracking tiers n&apos;est déposé sans votre consentement.</p>
            <p className="mt-2 font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              [À COMPLÉTER — Bannière cookie si analytics/tracking ajoutés ultérieurement]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Sous-traitants</h2>
            <p>Worthifast fait appel aux sous-traitants suivants :</p>
            <ul className="list-disc list-inside mt-3 space-y-1">
              <li><strong>Supabase</strong> — Base de données et authentification (hébergement France)</li>
              <li><strong>Vercel</strong> — Hébergement de l&apos;application (edge Europe)</li>
              <li><strong>Resend</strong> — Envoi d&apos;emails transactionnels</li>
              <li><strong>Mistral AI</strong> — Traitement IA (hébergé en France, RGPD)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Contact</h2>
            <p>DPO / Responsable protection des données : <a href="mailto:harounchikh71@gmail.com" className="text-emerald-600 hover:underline">harounchikh71@gmail.com</a></p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex gap-4 text-sm">
          <Link href="/cgu" className="text-emerald-600 hover:underline">CGU</Link>
          <Link href="/cgv" className="text-emerald-600 hover:underline">CGV</Link>
          <Link href="/mentions-legales" className="text-emerald-600 hover:underline">Mentions légales</Link>
        </div>
      </div>
    </div>
  )
}
