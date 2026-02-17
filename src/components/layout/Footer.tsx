import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-navy-950 text-navy-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FS</span>
              </div>
              <span className="font-display font-bold text-xl text-white">
                FinSoft
              </span>
            </Link>
            <p className="text-sm text-navy-400 max-w-sm">
              La solution simple et efficace pour piloter la rentabilité de votre entreprise. 
              Conçu pour les comptables et PME de Dijon et de toute la France.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Produit</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-sm hover:text-emerald-400 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/transactions" className="text-sm hover:text-emerald-400 transition-colors">
                  Transactions
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-sm hover:text-emerald-400 transition-colors">
                  Paramètres
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@finsoft.fr" className="text-sm hover:text-emerald-400 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-emerald-400 transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-emerald-400 transition-colors">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-navy-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-navy-500">
            © {new Date().getFullYear()} FinSoft. Tous droits réservés.
          </p>
          <p className="text-sm text-navy-500">
            Fait avec ❤️ à Dijon
          </p>
        </div>
      </div>
    </footer>
  )
}
