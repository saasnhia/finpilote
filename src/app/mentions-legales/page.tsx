import Link from 'next/link'
import { Header, Footer } from '@/components/layout'

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-display font-bold text-navy-900 mb-8">Mentions légales</h1>

          <div className="prose prose-navy max-w-none space-y-8 text-navy-700">
            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">Éditeur du logiciel</h2>
              <p>Worthifast est un logiciel édité par un développeur indépendant basé à Dijon, France.</p>
              <p className="mt-2">Contact : <a href="mailto:saasnhia@gmail.com" className="text-emerald-600 hover:underline">saasnhia@gmail.com</a></p>
              <p>Téléphone : <a href="tel:+33611752632" className="text-emerald-600 hover:underline">+33 6 11 75 26 32</a></p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">Hébergement</h2>
              <p>Le site vitrine est hébergé par Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis.</p>
              <p className="mt-2">Le logiciel Worthifast est installé <strong>localement sur le serveur du client</strong>. Aucune donnée comptable n&apos;est transmise à des tiers.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">Propriété intellectuelle</h2>
              <p>L&apos;ensemble des éléments du logiciel Worthifast (code source, interface, documentation) est protégé par le droit d&apos;auteur. Toute reproduction ou diffusion sans autorisation écrite est interdite.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">Responsabilité</h2>
              <p>Worthifast est un outil d&apos;aide à la comptabilité. Il ne se substitue pas au conseil d&apos;un expert-comptable agréé. L&apos;éditeur ne saurait être tenu responsable des décisions financières ou fiscales prises sur la base des données traitées par le logiciel.</p>
            </section>

            <section>
              <h2 className="text-xl font-display font-semibold text-navy-900 mb-3">Données personnelles</h2>
              <p>Voir notre <Link href="/confidentialite" className="text-emerald-600 hover:underline">politique de confidentialité</Link>.</p>
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
