'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react'
import { NAVIGATION_ITEMS, type NavigationItem } from '@/lib/search/navigation-index'
import { useCommandPalette } from '@/lib/search/use-command-palette'

const QUICK_ACCESS_IDS = ['dashboard', 'transactions', 'factures', 'rapprochement', 'tva', 'ia', 'relances', 'portail']
const ACTION_IDS = ['nouvelle-facture', 'nouveau-devis', 'import-fec']

const quickAccessItems = NAVIGATION_ITEMS.filter(i => QUICK_ACCESS_IDS.includes(i.id))
const actionItems = NAVIGATION_ITEMS.filter(i => ACTION_IDS.includes(i.id))

function filterItems(query: string): NavigationItem[] {
  if (!query) return []
  const q = query.toLowerCase().trim()
  return NAVIGATION_ITEMS.filter(item =>
    item.label.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.keywords.some(k => k.includes(q))
  ).slice(0, 10)
}

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const filtered = filterItems(query)
  const hasQuery = query.trim().length > 0

  // Build flat list of visible items for keyboard navigation
  const visibleItems: NavigationItem[] = hasQuery
    ? [...filtered, ...actionItems.filter(a => !filtered.some(f => f.id === a.id))]
    : [...quickAccessItems, ...actionItems]

  // Global Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(!open)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, setOpen])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const navigate = useCallback((item: NavigationItem) => {
    setOpen(false)
    router.push(item.href)
  }, [router, setOpen])

  // Keyboard navigation inside modal
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, visibleItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (visibleItems[selectedIndex]) {
        navigate(visibleItems[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }, [visibleItems, selectedIndex, navigate, setOpen])

  // Scroll selected item into view
  useEffect(() => {
    const container = listRef.current
    if (!container) return
    const selected = container.querySelector('[data-selected="true"]')
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!open) return null

  // Determine where the action group starts
  const mainItems = hasQuery ? filtered : quickAccessItems
  const mainLabel = hasQuery ? 'Résultats' : 'Accès rapide'
  const extraActions = hasQuery
    ? actionItems.filter(a => !filtered.some(f => f.id === a.id))
    : actionItems

  return (
    <div className="fixed inset-0 z-[100]" onKeyDown={handleKeyDown}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className="relative mx-auto mt-[18vh] w-full max-w-xl animate-scale-in">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 border-b border-slate-100">
            <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher une page, feature..."
              className="flex-1 py-4 text-base text-slate-900 placeholder:text-slate-400 outline-none bg-transparent focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[400px] overflow-y-auto p-2">
            {/* Main group */}
            {mainItems.length > 0 && (
              <div>
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {mainLabel}
                </p>
                {mainItems.map((item, idx) => {
                  const globalIdx = idx
                  return (
                    <ResultItem
                      key={item.id}
                      item={item}
                      selected={selectedIndex === globalIdx}
                      onClick={() => navigate(item)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                    />
                  )
                })}
              </div>
            )}

            {hasQuery && filtered.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                Aucun résultat pour &ldquo;{query}&rdquo;
              </p>
            )}

            {/* Actions rapides */}
            {extraActions.length > 0 && (
              <div>
                <p className="px-3 pt-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Actions rapides
                </p>
                {extraActions.map((item, idx) => {
                  const globalIdx = mainItems.length + idx
                  return (
                    <ResultItem
                      key={item.id}
                      item={item}
                      selected={selectedIndex === globalIdx}
                      onClick={() => navigate(item)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer hints */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> naviguer
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" /> ouvrir
            </span>
            <span>Esc fermer</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultItem({
  item,
  selected,
  onClick,
  onMouseEnter,
}: {
  item: NavigationItem
  selected: boolean
  onClick: () => void
  onMouseEnter: () => void
}) {
  return (
    <button
      data-selected={selected}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-left transition-colors
        ${selected ? 'bg-slate-100' : 'hover:bg-slate-50'}
      `}
    >
      <span className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-lg flex-shrink-0">
        {item.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 truncate">{item.label}</p>
        <p className="text-xs text-slate-500 truncate mt-0.5">{item.description}</p>
      </div>
      {selected && (
        <CornerDownLeft className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      )}
    </button>
  )
}
