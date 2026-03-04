# WORTHIFAST - CONTEXTE PROJET

## 🎯 Description
SaaS de comptabilité automatisée pour freelances et TPE en France. 
Import bancaire automatique, catégorisation IA, déclarations fiscales, audit comptable.

## 🛠️ Stack Technique
- **Framework**: Next.js 15.x (App Router)
- **Langage**: TypeScript 5.x
- **Base de données**: Supabase (PostgreSQL + Auth)
- **UI**: Shadcn/ui + Tailwind CSS 3.x
- **Icônes**: Lucide React
- **IA**: Anthropic Claude API (catégorisation transactions)
- **PDF**: pdf-lib (génération documents fiscaux)
- **Validation**: Zod
- **HTTP**: fetch natif Next.js

## 📁 Architecture
worthifast/
├── src/
│ ├── app/ # Next.js App Router
│ │ ├── api/ # API Routes
│ │ │ ├── banques/ # Gestion comptes bancaires (Phase 1)
│ │ │ ├── transactions/ # Gestion transactions
│ │ │ └── declarations/ # Déclarations fiscales (Phase 2)
│ │ ├── dashboard/ # Dashboard principal
│ │ ├── transactions/ # Liste transactions
│ │ ├── factures/ # Gestion factures
│ │ ├── parametres/banques/ # Gestion banques (Phase 1)
│ │ └── import-releve/ # Import relevés CSV (Phase 1)
│ ├── components/
│ │ ├── ui/ # Composants Shadcn
│ │ ├── layout/ # Header, Footer
│ │ ├── banques/ # Composants bancaires (Phase 1)
│ │ └── tva/ # Composants TVA (Phase 2)
│ ├── lib/
│ │ ├── parsers/ # bank-csv-parser.ts (Phase 1)
│ │ ├── categorization/ # smart-categorizer.ts (Phase 1)
│ │ ├── reconciliation/ # matcher.ts (Phase 1)
│ │ ├── tva/ # calculator.ts (Phase 2)
│ │ └── pdf/ # ca3-generator.ts (Phase 2)
│ ├── hooks/ # useBankAccounts.ts, useDeclarationsTVA.ts
│ ├── types/ # index.ts (interfaces TypeScript)
│ └── utils/ # Fonctions utilitaires
├── supabase/
│ ├── schema.sql # Schéma complet base de données
│ └── migrations/ # Migrations SQL par phase
└── public/ # Assets statiques

## 🗄️ Base de Données Supabase

### Tables Phase 1 (✅ Créées)

**transactions** (table principale étendue)
- Colonnes base : id, user_id, date, description, amount, type, category, compte_pcg, tva_taux, notes
- Colonnes Phase 1 : bank_account_id, source, status, confidence_score, original_description, import_batch_id, suggested_category, category_confirmed

**comptes_bancaires**
- Gestion comptes bancaires (IBAN, banque, solde, type)

**categories_personnalisees**
- Patterns de catégorisation appris (description_pattern, category, confidence_score, usage_count)

**rapprochements**
- Matching transactions manuelles vs bancaires (match_score, date_score, amount_score, description_score)

### Tables Phase 2 (📋 À créer)

**declarations_tva**
- Déclarations TVA CA3 (periode_debut, periode_fin, tva_collectee, tva_deductible, tva_a_payer, statut, fichier_pdf_url)

## ✅ Phase 1 - Import Bancaire (Terminée 04/02/2026)

### Fichiers Créés (17 fichiers)

**Backend Logic (3 fichiers)**
- `src/lib/parsers/bank-csv-parser.ts` - Parser CSV multi-banques (BNP Paribas, Société Générale, Crédit Agricole)
- `src/lib/categorization/smart-categorizer.ts` - Catégorisation 3 niveaux (custom patterns → regex → Claude API)
- `src/lib/reconciliation/matcher.ts` - Algorithme Levenshtein pour rapprochement bancaire

**API Routes (7 routes)**
- `src/app/api/banques/route.ts` - GET/POST comptes bancaires
- `src/app/api/banques/[id]/route.ts` - PUT/DELETE compte
- `src/app/api/banques/import-csv/route.ts` - Preview CSV
- `src/app/api/banques/confirm-import/route.ts` - Import transactions
- `src/app/api/banques/reconcile/route.ts` - POST/PUT rapprochement
- `src/app/api/transactions/auto-categorize/route.ts` - Catégorisation automatique

**Frontend (4 fichiers)**
- `src/app/parametres/banques/page.tsx` - Page gestion comptes bancaires
- `src/app/import-releve/page.tsx` - Page import relevés CSV
- `src/components/banques/UploadReleve.tsx` - Composant upload CSV
- `src/hooks/useBankAccounts.ts` - Hook CRUD comptes bancaires

**Navbar mise à jour**
- `src/components/layout/Header.tsx` - Ajout onglets "Banques" et "Import Relevé"

### Fonctionnalités Phase 1
- ✅ Import CSV relevés bancaires (auto-détection format)
- ✅ Catégorisation intelligente (3 niveaux : custom → regex → IA)
- ✅ Détection doublons (date + montant + description)
- ✅ Rapprochement bancaire automatique (scoring pondéré)
- ✅ Batch tracking avec UUID
- ✅ Support 3 banques françaises : BNP Paribas, Société Générale, Crédit Agricole

### Algorithmes Phase 1

**Catégorisation (3 niveaux)**
1. Patterns personnalisés utilisateur
2. 15+ regex prédéfinis français (URSSAF, EDF, loyer, SNCF, etc.)
3. Claude Haiku API (fallback si confidence < 80%)

**Rapprochement bancaire**
- Levenshtein distance pour similarité texte
- Scoring pondéré : Date (40%) + Montant (50%) + Description (10%)
- Auto-match si score ≥ 0.8
- Suggestions si score 0.6-0.8
- Rejet si score < 0.6

## 🔄 Phase 2 - Déclarations TVA (En cours)

### Objectif
Générer automatiquement les déclarations TVA CA3 conformes DGFiP avec calcul depuis transactions.

### À Créer

**1. Table Supabase**
```sql
CREATE TABLE declarations_tva (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  periode_debut DATE,
  periode_fin DATE,
  regime TEXT CHECK (regime IN ('mensuel', 'trimestriel')),
  tva_collectee NUMERIC(12,2),
  tva_deductible NUMERIC(12,2),
  tva_a_payer NUMERIC(12,2),
  statut TEXT CHECK (statut IN ('brouillon', 'validee', 'envoyee')),
  fichier_pdf_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
2. Backend Logic

src/lib/tva/calculator.ts - Calcul TVA automatique (collectée/déductible/à payer)

src/lib/pdf/ca3-generator.ts - Génération PDF CA3 avec pdf-lib

3. API Routes

POST /api/declarations/tva/calculate - Calcul TVA période

POST /api/declarations/tva/generate - Génération PDF

GET /api/declarations/tva - Liste déclarations

GET/PUT/DELETE /api/declarations/tva/[id] - CRUD déclaration

4. Frontend

src/app/declarations/tva/page.tsx - Page gestion déclarations TVA

src/components/tva/DeclarationCard.tsx - Carte déclaration

src/components/tva/NewDeclarationModal.tsx - Modal création

src/hooks/useDeclarationsTVA.ts - Hook CRUD déclarations

5. Navbar

Ajout onglet "TVA" entre "Import Relevé" et "Paramètres"

Logique Métier Phase 2
Détection régime : mensuel si CA > 4M€, trimestriel sinon

Calcul TVA collectée : sum(montant × tva_taux / 100) pour transactions type='income'

Calcul TVA déductible : sum(montant × tva_taux / 100) pour transactions type='expense'

TVA à payer = collectée - déductible

Génération PDF conforme formulaire CA3 (Cerfa 3310-CA3-SD)

📋 Phases 3-6 (Planifiées)
Phase 3 - Audit & Seuils Légaux

Détection seuils CAC (Code commerce)

Rapports audit automatiques

Anomalies comptables

Phase 4 - Multi-Clients & Alertes

Dashboard cabinets comptables

Gestion multi-clients

Système alertes intelligent

Phase 5 - Espace Collaboratif

Partage documents

Commentaires

Audit trail

Phase 6 - Mobile & RGPD

Version responsive

Export données

Conformité RGPD

🎨 Conventions de Code
Naming
Composants : PascalCase (BankAccountCard.tsx)

Hooks : useCamelCase (useBankAccounts.ts)

API Routes : kebab-case (import-csv/route.ts)

Functions : camelCase (calculateTVA)

Types : PascalCase (interface Transaction)

Structure API Route
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Auth check
    // Logic
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
🎨 Design System
Couleurs

Primary : Emerald (vert) - emerald-500, emerald-600

Secondary : Navy (bleu foncé) - navy-600, navy-900

Accent : Coral (rouge-orange) - coral-500

Success : green-500

Warning : yellow-500

Error : red-500

Composants : Shadcn/ui dans src/components/ui/

🔑 Variables d'Environnement
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
ANTHROPIC_API_KEY=sk-ant-xxx...
NEXT_PUBLIC_APP_URL=http://localhost:3000
🚀 Commandes
npm run dev              # Dev server (localhost:3000)
npm run build            # Build production
npm start                # Lance production
npm run lint             # ESLint
git add . && git commit -m "type: message" && git push
📦 Dépendances Clés
{
  "next": "^15.x",
  "react": "^18.x",
  "@supabase/auth-helpers-nextjs": "^0.x",
  "@supabase/supabase-js": "^2.x",
  "@anthropic-ai/sdk": "^0.x",
  "pdf-lib": "^1.x",
  "lucide-react": "^0.x",
  "tailwindcss": "^3.x",
  "zod": "^3.x"
}
🔐 Sécurité
Auth : Supabase Auth (email/password)

RLS : Row Level Security (policy: auth.uid() = user_id)

API : Vérification auth sur toutes les routes

Validation : Zod sur toutes les entrées

🐛 Debugging
Next.js : Terminal + browser console

Supabase : Dashboard → Logs

Browser : F12 → Console

VS Code : Breakpoints supportés

📞 Informations Projet
Repo Git : https://github.com/saasnhia/worthifast

Branche : main

Dernier commit : 8a16991 (Phase 1 SQL migration completed - 04/02/2026)

Dev : Étudiant L3 Management/Finance à Dijon

Cible : Cabinets comptables français, freelances, TPE

🎯 État Actuel
✅ Phase 1 : Import bancaire automatique (100% terminée)

🔄 Phase 2 : Déclarations TVA CA3 (à implémenter)

📋 Phases 3-6 : Planifiées
Dernière mise à jour : 05/02/2026 00:08 CET
Version : 1.0.0
Status : Phase 2 en attente d'implémentation

***

## ✅ **MAINTENANT :**

**1. Sélectionne TOUT le texte ci-dessus (du premier ` jusqu'au dernier `)**

**2. Copie (Ctrl+C)**

**3. Colle dans ton fichier CONTEXT.md (Ctrl+V)**

**4. Sauvegarde (Ctrl+S)**

**5. Commit :**
```bash
git add CONTEXT.md
git commit -m "docs: Add comprehensive project context"
git push
