import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: "Conditions Generales d'Utilisation | Worthifast",
}

export default function CGUPage() {
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
        <h1 className="text-3xl font-extrabold text-slate-900 mb-10">Conditions Generales d&apos;Utilisation</h1>

        <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Acceptation</h2>
            <p>
              L&apos;utilisation de Worthifast implique l&apos;acceptation des presentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Compte utilisateur</h2>
            <p>
              L&apos;utilisateur est responsable de la confidentialite de ses identifiants.
              Tout acces via son compte est repute etre effectue par lui.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Usage autorise</h2>
            <p>
              Worthifast est destine a un usage professionnel de comptabilite.
              Toute utilisation frauduleuse, illegale ou contraire aux bonnes moeurs est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Disponibilite</h2>
            <p>
              Worthifast s&apos;efforce d&apos;assurer une disponibilite maximale du service.
              Des interruptions pour maintenance peuvent survenir, avec information
              prealable des utilisateurs dans la mesure du possible.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Propriete intellectuelle</h2>
            <p>
              Le logiciel Worthifast et ses composants sont la propriete de ses fondateurs.
              L&apos;utilisateur dispose d&apos;un droit d&apos;usage non exclusif dans le cadre de son abonnement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Responsabilite</h2>
            <p>
              Worthifast est un outil d&apos;aide a la comptabilite. Il ne remplace pas
              le conseil d&apos;un expert-comptable diplome. L&apos;utilisateur reste responsable
              de ses declarations fiscales et comptables.
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
