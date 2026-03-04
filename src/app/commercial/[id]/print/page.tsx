'use client'

import { use, useState, useEffect } from 'react'
import type { DocumentCommercial } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  devis: 'DEVIS',
  bon_commande: 'BON DE COMMANDE',
  bon_livraison: 'BON DE LIVRAISON',
  proforma: 'FACTURE PROFORMA',
  avoir: 'AVOIR',
  facture_recurrente: 'FACTURE',
}

export default function PrintDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [doc, setDoc] = useState<DocumentCommercial | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/documents/${id}`)
      .then(r => r.json())
      .then(data => { if (data.success) setDoc(data.document) })
      .catch(() => {})
      .finally(() => {
        setLoading(false)
        setTimeout(() => window.print(), 400)
      })
  }, [id])

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-gray-400 text-sm">Chargement...</div>
    </div>
  )

  if (!doc) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-red-500 text-sm">Document introuvable</div>
    </div>
  )

  const totalRemise = doc.remise_percent > 0 ? doc.sous_total_ht * doc.remise_percent / 100 : 0
  const typeLabel = TYPE_LABELS[doc.type] ?? doc.type.toUpperCase()

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm 15mm 20mm 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #111; background: white; margin: 0; padding: 0; }
      `}</style>

      <div className="no-print fixed top-4 right-4 z-50">
        <button onClick={() => window.print()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium shadow-lg hover:bg-emerald-700 transition-colors">
          Imprimer / PDF
        </button>
        <button onClick={() => window.close()}
          className="ml-2 px-4 py-2 border border-gray-200 text-gray-700 bg-white rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-lg">
          Fermer
        </button>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 32px', background: 'white', minHeight: '100vh' }}>
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', paddingBottom: '24px', borderBottom: '2px solid #22D3A5' }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px' }}>Worthifast</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Logiciel de gestion comptable</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#22D3A5', letterSpacing: '1px' }}>{typeLabel}</div>
            {doc.numero && <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A', marginTop: '2px' }}>{doc.numero}</div>}
            {doc.date_emission && (
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                Émis le {new Date(doc.date_emission).toLocaleDateString('fr-FR')}
              </div>
            )}
            {doc.date_echeance && (
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Échéance : {new Date(doc.date_echeance).toLocaleDateString('fr-FR')}
              </div>
            )}
          </div>
        </div>

        {/* Destinataire */}
        {doc.client_nom && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Destinataire</div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>{doc.client_nom}</div>
            {doc.client_email && <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{doc.client_email}</div>}
            {doc.client_adresse && <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', whiteSpace: 'pre-line' }}>{doc.client_adresse}</div>}
            {doc.client_siren && <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>SIREN : {doc.client_siren}</div>}
          </div>
        )}

        {/* Tableau lignes */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '10px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
              <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '10px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qté</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '10px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PU HT</th>
              <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '10px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TVA</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '10px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {(doc.lignes ?? []).map((ligne, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '10px 12px', fontSize: '12px', color: '#0F172A' }}>{ligne.description || `Article ${i + 1}`}</td>
                <td style={{ padding: '10px 12px', fontSize: '12px', color: '#475569', textAlign: 'center' }}>{ligne.quantite}</td>
                <td style={{ padding: '10px 12px', fontSize: '12px', color: '#475569', textAlign: 'right' }}>{ligne.prix_unitaire_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                <td style={{ padding: '10px 12px', fontSize: '12px', color: '#475569', textAlign: 'center' }}>{ligne.taux_tva}%</td>
                <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '600', color: '#0F172A', textAlign: 'right' }}>{(ligne.quantite * ligne.prix_unitaire_ht).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <div style={{ width: '260px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', color: '#475569' }}>
              <span>Sous-total HT</span>
              <span>{doc.sous_total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
            </div>
            {doc.remise_percent > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', color: '#EF4444' }}>
                <span>Remise ({doc.remise_percent}%)</span>
                <span>-{totalRemise.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', color: '#475569' }}>
              <span>Total HT</span>
              <span>{doc.total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', color: '#475569' }}>
              <span>TVA</span>
              <span>{doc.total_tva.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
            </div>
            {doc.acompte > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', color: '#475569' }}>
                <span>Acompte versé</span>
                <span>-{doc.acompte.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', marginTop: '8px', backgroundColor: '#0F172A', borderRadius: '8px', fontSize: '14px', fontWeight: '700', color: 'white' }}>
              <span>TOTAL TTC</span>
              <span>{doc.total_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
            </div>
          </div>
        </div>

        {/* Conditions & Notes */}
        {(doc.conditions_paiement || doc.notes) && (
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '20px', display: 'grid', gridTemplateColumns: doc.conditions_paiement && doc.notes ? '1fr 1fr' : '1fr', gap: '24px' }}>
            {doc.conditions_paiement && (
              <div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Conditions de paiement</div>
                <div style={{ fontSize: '12px', color: '#475569' }}>{doc.conditions_paiement}</div>
              </div>
            )}
            {doc.notes && (
              <div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Notes</div>
                <div style={{ fontSize: '12px', color: '#475569', whiteSpace: 'pre-line' }}>{doc.notes}</div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '48px', paddingTop: '16px', borderTop: '1px solid #E2E8F0', textAlign: 'center', fontSize: '10px', color: '#94A3B8' }}>
          Document généré par Worthifast — Logiciel de gestion comptable & commerciale
        </div>
      </div>
    </>
  )
}
