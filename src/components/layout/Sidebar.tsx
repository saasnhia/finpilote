'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderOpen,
  Receipt,
  FileText,
  Building2,
  Upload,
  Euro,
  ArrowRightLeft,
  Shield,
  Settings,
  HelpCircle,
  BookOpen,
  MessageCircle,
  ChevronDown,
  Sliders,
  Users,
  Link2,
  Bell,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface SidebarSection {
  label: string
  icon: React.ElementType
  items: { name: string; href: string; icon: React.ElementType; badge?: boolean }[]
}

const sections: SidebarSection[] = [
  {
    label: 'Comptabilité',
    icon: Receipt,
    items: [
      { name: 'Transactions', href: '/transactions', icon: Receipt },
      { name: 'Factures', href: '/factures', icon: FileText },
      { name: 'Notifications', href: '/notifications', icon: Bell, badge: true },
      { name: 'Banques', href: '/parametres/banques', icon: Building2 },
      { name: 'Import Relevé', href: '/import-releve', icon: Upload },
      { name: 'TVA', href: '/tva', icon: Euro },
      { name: 'Rapprochement', href: '/rapprochement', icon: ArrowRightLeft },
    ],
  },
  {
    label: 'Audit',
    icon: Shield,
    items: [
      { name: 'Calcul seuils', href: '/audit/seuils', icon: Shield },
      { name: 'Tri comptes', href: '/audit/comptes', icon: FolderOpen },
    ],
  },
  {
    label: 'Paramètres',
    icon: Settings,
    items: [
      { name: 'Général', href: '/parametres', icon: Sliders },
      { name: 'Intégrations', href: '/parametres/banques', icon: Link2 },
      { name: 'Utilisateurs', href: '/parametres', icon: Users },
    ],
  },
  {
    label: "Centre d'aide",
    icon: HelpCircle,
    items: [
      { name: 'FAQ', href: '/faq', icon: HelpCircle },
      { name: 'Tutoriels', href: '/faq', icon: BookOpen },
      { name: 'Chatbot', href: '/faq', icon: MessageCircle },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['Comptabilité', 'Audit']))
  const [overdueCount, setOverdueCount] = useState(0)

  // Fetch overdue count for notification badge
  useEffect(() => {
    if (!user?.id) return
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications/overdue')
        const data = await res.json()
        if (data.success && data.stats) {
          setOverdueCount(data.stats.total_en_retard)
        }
      } catch { /* silent */ }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user?.id])

  const toggleSection = (label: string) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  return (
    <aside className="hidden lg:flex flex-col w-[220px] bg-brand-dark border-r border-white/5 h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
      {/* Dashboard link — always visible */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/dashboard"
          className={`
            flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${pathname === '/dashboard'
              ? 'bg-brand-green-primary text-white'
              : 'text-neutral-400 hover:bg-white/5 hover:text-white'
            }
          `}
        >
          <LayoutDashboard className="w-4 h-4" />
          Tableau de bord
        </Link>
      </div>

      {/* Sections */}
      <div className="flex-1 px-3 py-2 space-y-1">
        {sections.map((section) => {
          const isOpen = openSections.has(section.label)
          const hasActiveChild = section.items.some(i => pathname === i.href)

          return (
            <div key={section.label}>
              <button
                onClick={() => toggleSection(section.label)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors
                  ${hasActiveChild ? 'text-brand-green-action' : 'text-neutral-500 hover:text-neutral-300'}
                `}
              >
                <div className="flex items-center gap-2">
                  <section.icon className="w-3.5 h-3.5" />
                  {section.label}
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="ml-2 space-y-0.5 mt-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name + item.href}
                        href={item.href}
                        className={`
                          flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors
                          ${isActive
                            ? 'bg-brand-green-primary/10 text-brand-green-action font-medium'
                            : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                          }
                        `}
                      >
                        <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                        {item.name}
                        {item.badge && overdueCount > 0 && (
                          <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-coral-500 text-white text-[10px] font-bold leading-none">
                            {overdueCount > 99 ? '99+' : overdueCount}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/5">
        <p className="text-[10px] text-neutral-600 text-center">
          FinSoft v2.1 — Phase 8
        </p>
      </div>
    </aside>
  )
}
