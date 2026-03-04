'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { Send, Upload, FileText, MessageSquare, Loader2, CheckCircle } from 'lucide-react'

interface Doc { id: string; nom: string; type: string; uploaded_by: string; statut: string; created_at: string }
interface Msg { id: string; expediteur: string; message: string; created_at: string }
interface PortailInfo { client_nom: string; client_email: string }

// Public portal — no AppShell, no auth required
export default function PortailClientPublicPage() {
  const { token } = useParams<{ token: string }>()
  const [portail, setPortail] = useState<PortailInfo | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [messages, setMessages] = useState<Msg[]>([])
  const [activeTab, setActiveTab] = useState<'docs' | 'messages'>('docs')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)

  useEffect(() => {
    const init = async () => {
      const [docsRes, msgsRes] = await Promise.all([
        fetch(`/api/portail/${token}/documents`),
        fetch(`/api/portail/${token}/messages`),
      ])
      const docsData = await docsRes.json()
      const msgsData = await msgsRes.json()
      if (docsData.success) {
        setPortail({ client_nom: docsData.portail.client_nom, client_email: docsData.portail.client_email })
        setDocs(docsData.documents)
      } else {
        setNotFound(true)
      }
      if (msgsData.success) setMessages(msgsData.messages)
      setLoading(false)
    }
    void init()
  }, [token])

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    setSending(true)
    await fetch(`/api/portail/${token}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expediteur: portail?.client_nom ?? 'Client', message: newMessage }),
    })
    setNewMessage('')
    const res = await fetch(`/api/portail/${token}/messages`)
    const data = await res.json()
    if (data.success) setMessages(data.messages)
    setSending(false)
  }

  const uploadDoc = async () => {
    if (!fileName.trim()) return
    setUploading(true)
    await fetch(`/api/portail/${token}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: fileName.trim(), uploaded_by: 'client', type: 'autre' }),
    })
    setFileName('')
    setUploadDone(true)
    const res = await fetch(`/api/portail/${token}/documents`)
    const data = await res.json()
    if (data.success) setDocs(data.documents)
    setUploading(false)
    setTimeout(() => setUploadDone(false), 3000)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-500 text-lg">Portail introuvable ou expiré</p>
        <p className="text-gray-400 text-sm mt-2">Contactez votre cabinet pour obtenir un nouveau lien</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Image src="/logo-icon.svg" alt="Worthifast" width={32} height={32} className="rounded-lg" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">Worthifast — Espace client</p>
            <p className="text-xs text-gray-500">{portail?.client_nom}</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Bonjour, {portail?.client_nom} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Votre espace collaboratif avec votre cabinet comptable</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'docs' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <FileText className="w-4 h-4" />Documents
          </button>
          <button onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'messages' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <MessageSquare className="w-4 h-4" />Messagerie
          </button>
        </div>

        {activeTab === 'docs' && (
          <div className="space-y-4">
            {/* Upload */}
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center space-y-3">
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-600 font-medium">Déposer un document</p>
              <input value={fileName} onChange={e => setFileName(e.target.value)} placeholder="Nom du document (ex: Facture fournisseur janvier)"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
              <button onClick={() => void uploadDoc()} disabled={!fileName.trim() || uploading}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center gap-2 mx-auto">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : uploadDone ? <CheckCircle className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Envoi...' : uploadDone ? 'Envoyé !' : 'Envoyer'}
              </button>
            </div>

            {/* Docs list */}
            <div className="space-y-2">
              {docs.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">Aucun document</p>
              ) : docs.map(doc => {
                const isNew = (Date.now() - new Date(doc.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000
                const STATUT_MAP: Record<string, { label: string; cls: string }> = {
                  en_attente: { label: 'En attente', cls: 'bg-amber-100 text-amber-800' },
                  recu: { label: 'Reçu', cls: 'bg-blue-100 text-blue-800' },
                  traite: { label: 'Traité', cls: 'bg-indigo-100 text-indigo-800' },
                  valide: { label: 'Validé', cls: 'bg-emerald-100 text-emerald-800' },
                }
                const st = STATUT_MAP[doc.statut] ?? { label: doc.statut, cls: 'bg-gray-100 text-gray-800' }
                return (
                  <div key={doc.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.nom}
                        {isNew && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white uppercase">Nouveau</span>}
                      </p>
                      <p className="text-xs text-gray-400">{doc.uploaded_by === 'client' ? '📤 Envoyé par vous' : '📥 Du cabinet'} · {new Date(doc.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 min-h-[300px] max-h-[400px] overflow-y-auto space-y-3">
              {messages.length === 0 && <p className="text-center text-gray-400 text-sm py-12">Aucun message</p>}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.expediteur !== 'Cabinet' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${msg.expediteur !== 'Cabinet' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <p className="text-xs opacity-70 mb-1 font-medium">{msg.expediteur}</p>
                    <p>{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage() } }}
                placeholder="Votre message..."
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
              <button onClick={() => void sendMessage()} disabled={sending || !newMessage.trim()}
                className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="text-xs text-gray-400">Espace sécurisé Worthifast · Données chiffrées · Ne partagez pas ce lien</p>
      </footer>
    </div>
  )
}
