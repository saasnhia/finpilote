import Link from 'next/link'
import { Header, Footer } from '@/components/layout'

export default function CGVPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-display font-bold text-navy-900 mb-8">Conditions Générales de Vente</h1>

          <div className="prose prose-navy max-w-none space-y-8 text-navy-700">
            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">1. Objet</h2>
              <p>Les présentes CGV régissent la vente de licences perpétuelles du logiciel Worthifast entre l&apos;éditeur et tout client professionnel (cabinet comptable, PME, indépendant).</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">2. Licences et tarifs</h2>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Solo</strong> : 299 € HT — 1 utilisateur, 500 factures/an</li>
                <li><strong>Cabinet</strong> : 799 € HT — 5 utilisateurs, factures illimitées</li>
                <li><strong>Entreprise</strong> : 1 499 € HT — utilisateurs illimités, API dédiée</li>
              </ul>
              <p className="mt-3">Les prix s&apos;entendent hors taxes. TVA applicable au taux en vigueur (20%).</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">3. Nature de la licence</h2>
              <p>La licence est <strong>perpétuelle</strong> : le client acquiert un droit d&apos;usage permanent du logiciel dans sa version livrée. Les mises à jour majeures peuvent faire l&apos;objet d&apos;une facturation complémentaire.</p>
              <p className="mt-2">Le logiciel est installé sur le serveur du client. Aucune donnée n&apos;est hébergée par l&apos;éditeur.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">4. Paiement</h2>
              <p>Le paiement est exigible à la commande, par virement bancaire ou par tout autre moyen convenu. Une facture est émise après réception du paiement.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">5. Livraison et installation</h2>
              <p>Après confirmation du paiement, le client reçoit le package d&apos;installation et les instructions de mise en service dans un délai de 2 jours ouvrés. Une assistance à l&apos;installation est incluse.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">6. Droit de rétractation</h2>
              <p>Conformément à l&apos;article L.221-28 du Code de la consommation, le droit de rétractation ne s&apos;applique pas aux logiciels dont le sceau a été descellé. Pour les clients professionnels, aucun droit de rétractation légal n&apos;est applicable.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">7. Garanties et support</h2>
              <p>L&apos;éditeur garantit la conformité du logiciel à sa documentation pendant 12 mois. Le support email est inclus dans toutes les licences. Le plan Entreprise bénéficie d&apos;un support téléphonique 6h/jour.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">8. Droit applicable</h2>
              <p>Les présentes CGV sont soumises au droit français. En cas de litige, les tribunaux de Dijon (21000) seront seuls compétents.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">9. Contact</h2>
              <p>Pour toute question : <a href="mailto:saasnhia@gmail.com" className="text-emerald-600 hover:underline">saasnhia@gmail.com</a> — +33 6 11 75 26 32</p>
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
