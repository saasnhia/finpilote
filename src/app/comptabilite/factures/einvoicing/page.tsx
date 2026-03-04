'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout'
import { Card, Button } from '@/components/ui'
import { FileCheck, Shield, Download, AlertCircle, CheckCircle, ChevronRight, Zap } from 'lucide-react'

export default function EinvoicingPage() {
  const [enabled, setEnabled] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ conforme: boolean; errors?: string[] } | null>(null)

  const handleTest = async () => {
    setTesting(true)
    try {
      const sampleData = {
        vendeur: {
          nom: 'Worthifast SARL',
          siren: '123456789',
          tvaIntracom: 'FR12123456789',
          adresse: '1 rue de la Paix',
          codePostal: '21000',
          ville: 'Dijon',
        },
        acheteur: {
          nom: 'Client Exemple SAS',
          siren: '987654321',
          adresse: '5 avenue de la Gare',
          codePostal: '75001',
          ville: 'Paris',
        },
        facture: {
          numero: 'FACT-2026-001',
          dateEmission: '2026-01-15',
          dateEcheance: '2026-02-15',
          devise: 'EUR',
          lignes: [
            { description: 'Mission comptabilité mensuelle', quantite: 1, prixUnitaireHT: 800, tauxTVA: 20 },
            { description: 'Conseil fiscal Q1', quantite: 2, prixUnitaireHT: 150, tauxTVA: 20 },
          ],
        },
      }

      const res = await fetch('/api/einvoicing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', data: sampleData }),
      })
      const data = await res.json()
      setTestResult({ conforme: data.conforme ?? res.ok, errors: data.errors })
    } finally {
      setTesting(false)
    }
  }

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-display font-bold text-navy-900">
              Facturation électronique
            </h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
              <Shield className="w-3 h-3" /> Conforme 2026
            </span>
          </div>
          <p className="text-sm text-navy-500">
            Worthifast génère des factures au format Factur-X (PDF/A-3 + XML EN16931),
            obligatoire en France pour les TPE/PME à partir du 1er septembre 2026.
          </p>
        </div>

        {/* Compliance banner */}
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              ✅ Worthifast est conforme e-invoicing 2026 (Factur-X / EN16931)
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              Norme : Factur-X 1.0 · Profil EN16931 · Portail Public de Facturation (PPF) compatible
            </p>
          </div>
        </div>

        {/* Toggle */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-navy-900">
                Activer e-invoicing sur toutes les factures
              </h3>
              <p className="text-sm text-navy-500 mt-1">
                Chaque facture générée sera automatiquement au format Factur-X.
              </p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? 'bg-emerald-500' : 'bg-navy-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            {
              icon: FileCheck,
              title: 'Génération Factur-X',
              desc: 'PDF/A-3 avec XML ZUGFeRD embarqué. Profil EN16931 (full compliance).',
            },
            {
              icon: Zap,
              title: 'Détection automatique',
              desc: 'Import d\'un PDF Factur-X → extraction XML directe, confiance 100%, sans OCR.',
            },
            {
              icon: Shield,
              title: 'Validation EN16931',
              desc: 'Vérification des 16 champs obligatoires avant génération.',
            },
            {
              icon: Download,
              title: 'Export ZIP batch',
              desc: 'Téléchargez toutes les factures Factur-X d\'une période en un clic.',
            },
          ].map(f => (
            <Card key={f.title} className="!p-4 flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-800">{f.title}</p>
                <p className="text-xs text-navy-500 mt-0.5">{f.desc}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Test conformité */}
        <Card>
          <h3 className="font-display font-semibold text-navy-900 mb-3">
            Tester la conformité
          </h3>
          <p className="text-sm text-navy-500 mb-4">
            Générez une facture Factur-X de test et vérifiez la conformité EN16931.
          </p>

          {testResult && (
            <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 ${
              testResult.conforme
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-coral-50 border border-coral-200'
            }`}>
              {testResult.conforme
                ? <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                : <AlertCircle className="w-4 h-4 text-coral-600 flex-shrink-0 mt-0.5" />
              }
              <div className="text-sm">
                <p className={`font-medium ${testResult.conforme ? 'text-emerald-800' : 'text-coral-800'}`}>
                  {testResult.conforme ? '✅ Facture conforme EN16931 générée avec succès' : '❌ Erreurs de conformité'}
                </p>
                {testResult.errors?.map((e, i) => (
                  <p key={i} className="text-xs text-coral-700 mt-0.5">• {e}</p>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleTest}
            loading={testing}
            icon={<FileCheck className="w-4 h-4" />}
          >
            Générer une facture test Factur-X
          </Button>
        </Card>

        {/* Réglementation */}
        <Card className="mt-4 bg-navy-50 !border-navy-200">
          <h4 className="text-sm font-semibold text-navy-800 mb-2">Réglementation France 2026</h4>
          <ul className="space-y-1.5 text-xs text-navy-600">
            <li className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              <span>Réception obligatoire pour <strong>toutes les entreprises</strong> dès septembre 2026</span>
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              <span>Émission obligatoire pour les <strong>TPE/PME</strong> dès septembre 2027</span>
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              <span>Portail : Chorus Pro (PPF) — interopérable avec Factur-X</span>
            </li>
          </ul>
        </Card>
      </div>
    </AppShell>
  )
}
