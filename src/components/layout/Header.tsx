'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import {
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  HelpCircle,
  Plus,
  LayoutDashboard,
  Receipt,
  FileText,
  Building2,
  Upload,
  Euro,
  ArrowRightLeft,
  Shield,
  Settings,
} from 'lucide-react'

// Grouped nav items — exported for reuse by Sidebar
export const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'main' },
  { name: 'Transactions', href: '/transactions', icon: Receipt, group: 'compta' },
  { name: 'Factures', href: '/factures', icon: FileText, group: 'compta' },
  { name: 'Banques', href: '/parametres/banques', icon: Building2, group: 'compta' },
  { name: 'Import Relevé', href: '/import-releve', icon: Upload, group: 'compta' },
  { name: 'TVA', href: '/tva', icon: Euro, group: 'compta' },
  { name: 'Rapprochement', href: '/rapprochement', icon: ArrowRightLeft, group: 'compta' },
  { name: 'Audit Seuils', href: '/audit/seuils', icon: Shield, group: 'audit' },
  { name: 'Audit Comptes', href: '/audit/comptes', icon: Shield, group: 'audit' },
  { name: 'Paramètres', href: '/parametres', icon: Settings, group: 'settings' },
] as const

// Top-level header tabs
const headerTabs = [
  { name: 'Dashboard', href: '/dashboard', matchPrefix: '/dashboard' },
  { name: 'Comptabilité', href: '/transactions', matchPrefix: ['/transactions', '/factures', '/parametres/banques', '/import-releve', '/tva', '/rapprochement'] },
  { name: 'Audit', href: '/audit/seuils', matchPrefix: '/audit' },
]

export function Header() {
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isTabActive = (tab: typeof headerTabs[number]) => {
    if (Array.isArray(tab.matchPrefix)) {
      return tab.matchPrefix.some(p => pathname.startsWith(p))
    }
    return pathname.startsWith(tab.matchPrefix)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-brand-black">
      <nav className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo + slogan */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-green-action rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">FS</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-bold text-white text-base">
                FinSoft
              </span>
              <span className="hidden lg:inline text-[11px] text-neutral-400 ml-2">
                Automatisez, sécurisez, gagnez du temps
              </span>
            </div>
          </Link>

          {/* Desktop Tabs */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {headerTabs.map((tab) => {
                const active = isTabActive(tab)
                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`
                      px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200
                      ${active
                        ? 'bg-brand-green-primary text-white'
                        : 'text-neutral-400 hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    {tab.name}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <>
                {/* New project button */}
                <Link href="/audit/seuils" className="hidden md:block">
                  <Button
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                    className="!bg-brand-green-action hover:!bg-brand-green-hover !shadow-none !from-brand-green-action !to-brand-green-action"
                  >
                    Nouveau projet
                  </Button>
                </Link>

                {/* Help */}
                <Link
                  href="/faq"
                  className="hidden md:flex p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Aide"
                >
                  <HelpCircle className="w-4 h-4 text-neutral-400" />
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt=""
                        className="w-7 h-7 rounded-full"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-brand-green-primary/20 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-brand-green-action" />
                      </div>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 z-20 animate-slide-down">
                        <div className="px-4 py-3 border-b border-neutral-100">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {user.user_metadata?.full_name || 'Utilisateur'}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          href="/parametres"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Paramètres
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-coral-600 hover:bg-coral-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Déconnexion
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5 text-white" />
                  ) : (
                    <Menu className="w-5 h-5 text-white" />
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="!text-neutral-300 hover:!text-white hover:!bg-white/10">
                    Connexion
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="!bg-brand-green-action hover:!bg-brand-green-hover !shadow-none !from-brand-green-action !to-brand-green-action">
                    S&apos;inscrire
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {user && mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 animate-slide-down">
            <div className="flex flex-col gap-1">
              {NAVIGATION_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href.startsWith('/audit') && pathname.startsWith('/audit'))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                      transition-colors duration-200
                      ${isActive
                        ? 'bg-brand-green-primary text-white'
                        : 'text-neutral-400 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                )
              })}
              <Link
                href="/faq"
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-colors duration-200
                  ${pathname === '/faq'
                    ? 'bg-brand-green-primary text-white'
                    : 'text-neutral-400 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <HelpCircle className="w-5 h-5" />
                FAQ / Aide
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
