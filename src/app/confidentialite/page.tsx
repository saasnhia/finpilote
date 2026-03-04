import Link from 'next/link'
import { Header, Footer } from '@/components/layout'

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-display font-bold text-navy-900 mb-2">Politique de confidentialité</h1>
          <p className="text-sm text-navy-400 mb-8">Conformité RGPD — Règlement UE 2016/679</p>

          <div className="prose prose-navy max-w-none space-y-8 text-navy-700">
            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">1. Responsable du traitement</h2>
              <p>Worthifast — contact : <a href="mailto:saasnhia@gmail.com" className="text-emerald-600 hover:underline">saasnhia@gmail.com</a>, +33 6 11 75 26 32, Dijon (21000), France.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">2. Architecture locale — pas de cloud</h2>
              <p>Worthifast est un logiciel installé <strong>sur le serveur de votre entreprise</strong>. Vos données comptables (factures, transactions bancaires, données fournisseurs) restent exclusivement sur votre infrastructure. L&apos;éditeur n&apos;y a pas accès.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">3. Données collectées sur ce site</h2>
              <p>Le site vitrine (worthifast.vercel.app) peut collecter :</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Nom, email, téléphone via le formulaire de demande de démo</li>
                <li>Données de navigation anonymisées (logs Vercel)</li>
              </ul>
              <p className="mt-2">Ces données sont utilisées uniquement pour répondre à votre demande. Elles ne sont pas revendues.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">4. APIs tierces utilisées par le logiciel</h2>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>API Recherche Entreprises</strong> (api.gouv.fr) — enrichissement SIREN, données publiques INPI</li>
                <li><strong>API VIES</strong> (Commission Européenne) — validation numéros TVA UE</li>
                <li><strong>Pappers.fr</strong> — données légales et financières entreprises françaises</li>
              </ul>
              <p className="mt-2">Ces APIs reçoivent uniquement les identifiants fiscaux (SIREN, numéros TVA) nécessaires à leur fonctionnement.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">5. Droits des personnes</h2>
              <p>Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement et de portabilité de vos données. Exercez ces droits par email : <a href="mailto:saasnhia@gmail.com" className="text-emerald-600 hover:underline">saasnhia@gmail.com</a>.</p>
              <p className="mt-2">En cas de réclamation, vous pouvez contacter la CNIL : <a href="https://www.cnil.fr" className="text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">6. Cookies</h2>
              <p>Ce site n&apos;utilise pas de cookies publicitaires ou de tracking. Les cookies techniques de session Supabase sont nécessaires au fonctionnement de l&apos;authentification.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">7. Mise à jour</h2>
              <p>Dernière mise à jour : février 2026.</p>
            </section>
          </div>

          <div className="mt-12">
            <Link href="/" className="text-sm text-navy-400 hover:text-navy-600">← Retour à l&apos;accueil</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
