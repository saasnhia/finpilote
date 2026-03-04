import Link from 'next/link'

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-emerald-600 hover:underline mb-8 block">← Retour à l&apos;accueil</Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Conditions Générales d&apos;Utilisation</h1>
        <p className="text-sm text-slate-400 mb-10">Dernière mise à jour : mars 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Objet</h2>
            <p>Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation de la plateforme Worthifast, éditée par Worthifast SAS, accessible à l&apos;adresse worthifast.vercel.app.</p>
            <p className="mt-2">En accédant à la plateforme, l&apos;utilisateur accepte sans réserve les présentes CGU.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Description du service</h2>
            <p>Worthifast est une solution SaaS de gestion comptable et commerciale destinée aux experts-comptables, PME et indépendants. Le service comprend notamment :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>La capture et reconnaissance automatique de documents comptables (OCR)</li>
              <li>Le rapprochement bancaire assisté par intelligence artificielle</li>
              <li>La gestion commerciale (devis, commandes, factures, avoirs)</li>
              <li>Le portail de partage de documents avec les clients</li>
              <li>L&apos;assistant IA intégrant le Plan Comptable Général (PCG) et les références BOFIP</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Accès au service</h2>
            <p>L&apos;accès à Worthifast est soumis à la création d&apos;un compte utilisateur. L&apos;utilisateur est responsable de la confidentialité de ses identifiants de connexion. Tout accès effectué depuis son compte est réputé effectué par l&apos;utilisateur.</p>
            <p className="mt-2">Worthifast se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Données personnelles</h2>
            <p>Le traitement des données personnelles est régi par notre <Link href="/politique-confidentialite" className="text-emerald-600 hover:underline">Politique de confidentialité</Link>. Les données sont hébergées en France sur des serveurs certifiés HDS, conformément au RGPD.</p>
            <p className="mt-2 font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              [À COMPLÉTER PAR UN AVOCAT — Mentions RGPD détaillées, durée de conservation, droits des utilisateurs]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Propriété intellectuelle</h2>
            <p>L&apos;ensemble des éléments constituant la plateforme Worthifast (code, design, marque, contenus) est la propriété exclusive de Worthifast SAS. Toute reproduction, représentation ou exploitation non autorisée est strictement interdite.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Responsabilité</h2>
            <p>Worthifast met tout en œuvre pour assurer la disponibilité et la fiabilité du service. Toutefois, Worthifast ne saurait être tenu responsable en cas d&apos;indisponibilité temporaire du service, de perte de données résultant d&apos;une faute de l&apos;utilisateur, ou de tout dommage indirect.</p>
            <p className="mt-2 font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              [À COMPLÉTER PAR UN AVOCAT — Clause limitative de responsabilité, SLA, garanties]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Modification des CGU</h2>
            <p>Worthifast se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par email de toute modification substantielle. La poursuite de l&apos;utilisation du service après notification vaut acceptation des nouvelles CGU.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Droit applicable</h2>
            <p>Les présentes CGU sont soumises au droit français. Tout litige relatif à leur interprétation ou exécution sera soumis aux tribunaux compétents de Paris.</p>
            <p className="mt-2 font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              [À COMPLÉTER PAR UN AVOCAT — Clause d&apos;arbitrage, médiation, juridiction compétente]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Contact</h2>
            <p>Pour toute question relative aux présentes CGU : <a href="mailto:harounchikh71@gmail.com" className="text-emerald-600 hover:underline">harounchikh71@gmail.com</a></p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex gap-4 text-sm">
          <Link href="/cgv" className="text-emerald-600 hover:underline">CGV</Link>
          <Link href="/politique-confidentialite" className="text-emerald-600 hover:underline">Politique de confidentialité</Link>
          <Link href="/mentions-legales" className="text-emerald-600 hover:underline">Mentions légales</Link>
        </div>
      </div>
    </div>
  )
}
