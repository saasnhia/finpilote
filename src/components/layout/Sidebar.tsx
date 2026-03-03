'use client'

import { useState, useEffect } from 'react'
import { PlanBadge } from '@/components/plan/PlanGate'
import { UserCountBadge } from '@/components/plan/UserCountBadge'
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
  Bell,
  Plug,
  FileCheck,
  Briefcase,
  Sparkles,
  BarChart3,
  Wand2,
  Zap,
  Landmark,
  PieChart,
  Bot,
  RefreshCw,
  Users2,
  ShoppingCart,
  Package,
  MessageSquare,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

interface SidebarSection {
  label: string
  icon: React.ElementType
  items: { name: string; href: string; icon: React.ElementType; badge?: 'overdue' | 'relances'; planTag?: string }[]
}

const sections: SidebarSection[] = [
  {
    label: 'Comptabilité',
    icon: Receipt,
    items: [
      { name: 'Transactions', href: '/transactions', icon: Receipt },
      { name: 'Factures', href: '/factures', icon: FileText },
      { name: 'Relances', href: '/relances', icon: RefreshCw, badge: 'relances' },
      { name: 'Notifications', href: '/notifications', icon: Bell, badge: 'overdue' },
      { name: 'Banques', href: '/parametres/banques', icon: Building2 },
      { name: 'Import Relevé', href: '/import-releve', icon: Upload },
      { name: 'TVA', href: '/tva', icon: Euro },
      { name: 'Rapprochement', href: '/rapprochement', icon: ArrowRightLeft },
      { name: 'Immobilisations', href: '/dashboard/immobilisations', icon: Building2 },
      { name: 'Analytique', href: '/dashboard/analytique', icon: PieChart },
      { name: 'Liasses fiscales', href: '/dashboard/liasses', icon: FileText, planTag: 'Premium' },
    ],
  },
  {
    label: 'IA & Automatisation',
    icon: Sparkles,
    items: [
      { name: 'Agents IA', href: '/dashboard/agents', icon: Bot, planTag: 'Premium' },
      { name: 'Assistant PCG/BOFIP', href: '/dashboard/assistant', icon: MessageSquare, planTag: 'Essentiel+' },
    ],
  },
  {
    label: 'Audit',
    icon: Shield,
    items: [
      { name: 'Balance âgée', href: '/audit/balance-agee', icon: BarChart3 },
      { name: 'Tri comptes', href: '/audit/comptes', icon: FolderOpen },
      { name: 'Automatisation', href: '/automatisation', icon: Zap },
    ],
  },
  {
    label: 'Commercial',
    icon: ShoppingCart,
    items: [
      { name: 'Documents', href: '/commercial', icon: ShoppingCart },
      { name: 'Catalogue', href: '/commercial/catalogue', icon: Package },
      { name: 'Abonnements', href: '/commercial/abonnements', icon: RefreshCw },
      { name: 'Imports', href: '/commercial/imports', icon: Upload },
    ],
  },
  {
    label: 'Finances',
    icon: Euro,
    items: [
      { name: 'Notes de frais', href: '/dashboard/notes-de-frais', icon: Receipt },
    ],
  },
  {
    label: 'Achats',
    icon: ShoppingCart,
    items: [
      { name: 'Demandes d\'achat', href: '/dashboard/achats', icon: ShoppingCart },
    ],
  },
  {
    label: 'Cabinet',
    icon: Briefcase,
    items: [
      { name: 'Mes dossiers', href: '/cabinet', icon: FolderOpen },
      { name: 'Portail Clients', href: '/portail', icon: Users2 },
      { name: 'Portail simplifié', href: '/dashboard/cabinet/portail', icon: Users, planTag: 'Cabinet' },
      { name: 'E-invoicing 2026', href: '/comptabilite/factures/einvoicing', icon: FileCheck },
    ],
  },
  {
    label: 'Paramètres',
    icon: Settings,
    items: [
      { name: 'Général', href: '/dashboard/settings', icon: Sliders },
      { name: 'Règles auto', href: '/parametres/regles', icon: Wand2 },
      { name: 'Intégrations', href: '/parametres/integrations', icon: Plug },
      { name: 'Utilisateurs', href: '/admin/users', icon: Users },
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
  const [relancesCount, setRelancesCount] = useState(0)
  const [profileType, setProfileType] = useState<'cabinet' | 'entreprise'>('cabinet')

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

  // Fetch relances count
  useEffect(() => {
    if (!user?.id) return
    const fetchRelances = async () => {
      try {
        const res = await fetch('/api/relances/retard')
        const data = await res.json()
        if (data.success && data.factures) {
          setRelancesCount(data.factures.length)
        }
      } catch { /* silent */ }
    }
    fetchRelances()
    const interval = setInterval(fetchRelances, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user?.id])

  const [profileName, setProfileName] = useState<string>('')
  const [profilePlan, setProfilePlan] = useState<string>('starter')

  // Fetch profile_type, name and plan
  useEffect(() => {
    if (!user?.id) return
    const fetchProfile = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('user_profiles')
          .select('profile_type, prenom, nom, plan')
          .eq('id', user.id)
          .single()
        if (data?.profile_type) setProfileType(data.profile_type as 'cabinet' | 'entreprise')
        if (data?.prenom || data?.nom) setProfileName(`${data.prenom ?? ''} ${data.nom ?? ''}`.trim())
        if (data?.plan) setProfilePlan(String(data.plan))
      } catch { /* silent */ }
    }
    fetchProfile()
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
      {/* Dashboard + IA links — always visible */}
      <div className="px-3 pt-4 pb-2 space-y-0.5">
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
        <Link
          href="/ia"
          className={`
            flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${pathname === '/ia'
              ? 'bg-brand-green-primary text-white'
              : 'text-neutral-400 hover:bg-white/5 hover:text-white'
            }
          `}
        >
          <Sparkles className="w-4 h-4" />
          Assistant IA
        </Link>
        <Link
          href="/ia/mes-agents"
          className={`
            flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${pathname.startsWith('/ia/mes-agents') || pathname.startsWith('/ia/creer-agent')
              ? 'bg-brand-green-primary text-white'
              : 'text-neutral-400 hover:bg-white/5 hover:text-white'
            }
          `}
        >
          <Bot className="w-4 h-4" />
          Mes Agents
        </Link>
      </div>

      {/* Sections */}
      <div className="flex-1 px-3 py-2 space-y-1">
        {/* Mon entreprise — visible uniquement en mode entreprise */}
        {profileType === 'entreprise' && (
          <div>
            <button
              onClick={() => toggleSection('Mon entreprise')}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors
                ${['/entreprise/depenses', '/entreprise/tresorerie'].some(h => pathname === h)
                  ? 'text-brand-green-action'
                  : 'text-neutral-500 hover:text-neutral-300'}
              `}
            >
              <div className="flex items-center gap-2">
                <Landmark className="w-3.5 h-3.5" />
                Mon entreprise
              </div>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${openSections.has('Mon entreprise') ? 'rotate-180' : ''}`} />
            </button>

            {openSections.has('Mon entreprise') && (
              <div className="ml-2 space-y-0.5 mt-0.5">
                {[
                  { name: 'Dépenses', href: '/entreprise/depenses', icon: PieChart },
                  { name: 'Trésorerie', href: '/entreprise/tresorerie', icon: Landmark },
                ].map(item => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
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
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

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
                        <span className="truncate">{item.name}</span>
                        {(() => {
                          const count = item.badge === 'relances' ? relancesCount : item.badge === 'overdue' ? overdueCount : 0
                          if (count > 0) return (
                            <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-coral-500 text-white text-[10px] font-bold leading-none">
                              {count > 99 ? '99+' : count}
                            </span>
                          )
                          if (item.planTag) return (
                            <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 whitespace-nowrap">
                              {item.planTag}
                            </span>
                          )
                          return null
                        })()}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* User avatar + Settings link */}
      <div className="px-3 py-2 border-t border-white/5">
        <Link
          href="/dashboard/settings"
          className={`
            flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group w-full
            ${pathname.startsWith('/dashboard/settings') ? 'bg-white/5' : ''}
          `}
        >
          <div className="w-7 h-7 rounded-full bg-brand-green-primary/20 flex items-center justify-center text-brand-green-action text-[11px] font-bold flex-shrink-0 uppercase">
            {(profileName || user?.email || 'U')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-neutral-300 truncate leading-tight">
              {profileName || user?.email?.split('@')[0] || 'Mon compte'}
            </p>
            <p className="text-[10px] text-neutral-500 leading-tight capitalize">{profilePlan}</p>
          </div>
          <Settings className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0" />
        </Link>
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/5 flex flex-col items-center gap-2">
        <UserCountBadge />
        <PlanBadge />
        <p className="text-[10px] text-neutral-600 text-center">
          FinSoft v2.1
        </p>
      </div>
    </aside>
  )
}
