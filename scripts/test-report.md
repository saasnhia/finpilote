# 📋 Worthifast — Rapport de Tests E2E

> Généré le 24/02/2026 · Durée totale : 16.2s · Serveur : http://localhost:3000

## Résumé global

| Métrique | Valeur |
|---|---|
| Score | **21/26** tests passés (81%) |
| ✅ PASS | 21 |
| ❌ FAIL | 5 |
| ⚠️  SKIP | 1 |
| ⏱ Durée | 16.2s |

> ⚠️ **5 échecs détectés — 2 vrais bugs, 3 paramètres manquants dans le test runner.**

---

## Résultats par feature

### COMPTABILITÉ

⚠️ **SKIP** — `GET /api/transactions` — *Route non implémentée côté API* — les transactions sont lues directement via le client Supabase JS dans les hooks (useTransactions). Comportement normal et attendu.

❌ **FAIL** — `POST /api/factures/upload` — OCR + extraction métadonnées — 1624ms — `HTTP 500`
> `{"error":"Error: Error: Invalid XRef stream"}`

✅ **PASS** — `GET /api/banques` — liste comptes bancaires — 393ms

✅ **PASS** — `POST /api/banques/import-csv` — import relevé CSV (15 lignes) — 357ms

### TVA

✅ **PASS** — `POST /api/tva/calculate` — calcul TVA trimestre — 411ms

✅ **PASS** — `GET /api/tva/declarations` — liste déclarations — 294ms

❌ **FAIL** — `POST /api/tva/generate-ca3` — génération PDF CA3 — 282ms — `HTTP 400`
> `{"error":"Paramètres manquants: periode_debut, periode_fin"}`

✅ **PASS** — `POST /api/tva/valider` — validation numéro TVA VIES (FR12345678901) — 692ms

### RAPPROCHEMENT

✅ **PASS** — `GET /api/rapprochement/anomalies` — liste anomalies (10 seedées) — 251ms

✅ **PASS** — `GET /api/rapprochement/suggestions` — suggestions auto — 349ms

✅ **PASS** — `POST /api/rapprochement/match` — matching automatique factures ↔ transactions — 690ms

✅ **PASS** — `PUT /api/rapprochement/anomalies` — résoudre une anomalie — 259ms

❌ **FAIL** — `POST /api/rapprochement/valider` — valider un rapprochement — 276ms — `HTTP 400`
> `{"error":"Paramètre manquant: action"}`

### ALERTES & KPIs

✅ **PASS** — `GET /api/alerts` — liste alertes actives (5 seedées) — 283ms

✅ **PASS** — `GET /api/benchmarks` — métriques sectorielles — 190ms

✅ **PASS** — `GET /api/metrics/comparative` — comparatif mensuel — 292ms

### AUDIT

❌ **FAIL** — `POST /api/audit/accounts` — triage comptes PCG — 178ms — `HTTP 400`
> `{"error":"CA HT et total bilan sont requis"}`

✅ **PASS** — `GET /api/audit/thresholds` — seuils légaux — 231ms

### NOTIFICATIONS

✅ **PASS** — `GET /api/notifications/factures` — factures en retard — 278ms

❌ **FAIL** — `POST /api/notifications/send-reminder` — envoi email rappel — 1007ms — `HTTP 500`
> `{"success":false,"error":"Échec envoi email: Aucun service email configuré (RESEND_API_KEY ou SMTP_HOST requis)"}`

### EXPORT

✅ **PASS** — `GET /api/export/fec?preview=true` — export FEC JSON preview — 350ms

✅ **PASS** — `GET /api/export/fec?format=txt` — téléchargement fichier FEC — 197ms
> `Content-Disposition: attachment; filename="000000000FEC20251231.txt"`

### ENTREPRISES

✅ **PASS** — `GET /api/entreprises/123456789` — enrichissement SIREN fictif — 1159ms

### AGENTS IA (Mistral)

✅ **PASS** — `POST /api/ai/agent-audit` — analyse anomalies PCG — 2878ms

✅ **PASS** — `POST /api/ai/agent-tva` — résumé CA3 Mistral — 2417ms

✅ **PASS** — `POST /api/ai/agent-rapprochement` — explications anomalies — 351ms

✅ **PASS** — `POST /api/ai/agent-mail` — génération rappels email — 366ms

---

## 🐛 Analyse des échecs (5)

### Bug 1 — `POST /api/factures/upload` ← **VRAI BUG**

- **Fichier** : `src/app/api/factures/upload/route.ts`
- **Code HTTP** : 500
- **Erreur renvoyée** : `"Error: Error: Invalid XRef stream"`
- **Cause racine** : Le fichier PDF minimal généré par le test (faux PDF textuel, non conforme au standard PDF 1.4) déclenche une exception dans `pdf2json` (`Invalid XRef stream`). L'exception remonte jusqu'au handler sans être interceptée avec un message d'erreur utilisateur clair.
- **Correction prioritaire** : Ajouter un `try/catch` spécifique autour du bloc `pdf2json` et renvoyer HTTP 422 avec message `"Fichier PDF invalide ou corrompu"` plutôt que de laisser l'erreur interne fuiter.
  ```
  // src/app/api/factures/upload/route.ts — ajouter :
  } catch (pdfErr) {
    return NextResponse.json({ error: 'PDF invalide ou corrompu' }, { status: 422 })
  }
  ```
- **Fichier + ligne approx.** : `route.ts:14-31` (bloc extractTextFromPdf)

---

### Bug 2 — `POST /api/tva/generate-ca3` ← **PARAMÈTRES MANQUANTS (test runner)**

- **Fichier** : `src/app/api/tva/generate-ca3/route.ts`
- **Code HTTP** : 400
- **Erreur renvoyée** : `"Paramètres manquants: periode_debut, periode_fin"`
- **Cause racine** : Le test envoyait `{ declaration_id }` mais la route attend `{ periode_debut, periode_fin, regime? }`. Pas un bug de production.
- **Correction du test** : Passer `{ periode_debut: "2025-10-01", periode_fin: "2025-12-31" }` au lieu du `declaration_id`.
- **Sévérité** : Test runner à corriger — la route est correcte.

---

### Bug 3 — `POST /api/rapprochement/valider` ← **PARAMÈTRES MANQUANTS (test runner)**

- **Fichier** : `src/app/api/rapprochement/valider/route.ts`
- **Code HTTP** : 400
- **Erreur renvoyée** : `"Paramètre manquant: action"`
- **Cause racine** : Le test envoyait `{}` sans le champ `action`. La route attend `{ action: 'valider'|'rejeter'|'creer', rapprochement_id? }`.
- **Correction du test** : Passer `{ action: 'creer', facture_id: '...', transaction_id: '...' }` pour tester la création manuelle d'un rapprochement.
- **Sévérité** : Test runner à corriger — la route est correcte.

---

### Bug 4 — `POST /api/audit/accounts` ← **PARAMÈTRES MANQUANTS (test runner)**

- **Fichier** : `src/app/api/audit/accounts/route.ts`
- **Code HTTP** : 400
- **Erreur renvoyée** : `"CA HT et total bilan sont requis"`
- **Cause racine** : Le test envoyait `{}`. La route attend un body structuré :
  ```json
  {
    "chiffre_affaires_ht": 500000,
    "total_bilan": 1000000,
    "balance": [
      { "numero_compte": "601", "libelle": "Achats matières", "classe": "6",
        "solde_net": 50000, "mouvement_debit": 60000, "mouvement_credit": 10000 }
    ]
  }
  ```
- **Sévérité** : Test runner à corriger — la route est correcte.

---

### Bug 5 — `POST /api/notifications/send-reminder` ← **VRAI BUG (config manquante)**

- **Fichier** : `src/app/api/notifications/send-reminder/route.ts`
- **Code HTTP** : 500
- **Erreur renvoyée** : `"Aucun service email configuré (RESEND_API_KEY ou SMTP_HOST requis)"`
- **Cause racine** : `RESEND_API_KEY` est absent du `.env.local` (seul `RESEND_FROM_EMAIL` est configuré). La fonction `sendEmail()` vérifie la présence de la clé et retourne une erreur, mais elle est encapsulée dans un `try/catch` qui renvoie HTTP 500 au lieu de 422 ou d'un message orienté utilisateur.
- **Corrections à apporter** :
  1. **Court terme** : Ajouter `RESEND_API_KEY` dans `.env.local` (obtenir sur resend.com, plan gratuit 3000 emails/mois)
  2. **Moyen terme** : Renvoyer HTTP 422 avec message clair (`"Configuration email manquante"`) au lieu de 500, pour distinguer erreur de config vs erreur serveur
- **Fichier + ligne** : `src/lib/email-sender.ts` — condition de vérification de la clé API

---

## ✅ Points forts confirmés

| Feature | Statut |
|---------|--------|
| Import CSV bancaire (15 lignes) | ✅ Opérationnel |
| Calcul TVA trimestriel | ✅ Opérationnel |
| Liste déclarations TVA | ✅ Opérationnel |
| Validation TVA intracommunautaire VIES | ✅ Opérationnel |
| Rapprochement automatique (matching) | ✅ Opérationnel |
| Gestion anomalies (liste + résolution) | ✅ Opérationnel |
| Alertes KPIs (liste) | ✅ Opérationnel |
| Benchmarks sectoriels | ✅ Opérationnel |
| Métriques comparatives | ✅ Opérationnel |
| Seuils légaux audit | ✅ Opérationnel |
| Export FEC (preview + téléchargement .txt) | ✅ Opérationnel |
| Enrichissement SIREN | ✅ Opérationnel |
| Agent IA Audit (Mistral) | ✅ Opérationnel |
| Agent IA TVA (Mistral) | ✅ Opérationnel |
| Agent IA Rapprochement (Mistral) | ✅ Opérationnel |
| Agent IA Mail (Mistral) | ✅ Opérationnel |

---

## 🔧 Corrections prioritaires

### Priorité 1 — Bug serveur (à corriger maintenant)
1. **`src/app/api/factures/upload/route.ts`** — Ajouter gestion d'erreur spécifique autour de `pdf2json` → renvoyer HTTP 422 `"PDF invalide"` au lieu de laisser fuiter l'exception interne. Fichier + ligne : `route.ts:14-31`

2. **`.env.local`** — Ajouter `RESEND_API_KEY=<votre_clé_resend>` pour activer l'envoi d'emails. Obtenir sur [resend.com](https://resend.com) (plan gratuit). Aussi ajouter `RESEND_API_KEY` sur Vercel.

### Priorité 2 — Améliorations UX (bon à faire)
3. **`src/app/api/notifications/send-reminder/route.ts`** — Renvoyer HTTP 422 avec message `"Service email non configuré"` plutôt que 500 pour distinguer config vs crash serveur.

### Priorité 3 — Schéma base de données
4. **`factures.statut`** — Le code dans `/api/rapprochement/match` utilise `.in('statut', ['en_attente', 'validee', 'brouillon'])` mais `brouillon` n'est pas une valeur valide selon la contrainte CHECK. Harmoniser le code ou la contrainte.

---

## Notes techniques

- Tests exécutés sur `http://localhost:3000` (Next.js dev)
- Authentification : cookie `sb-jwaqsszcaicikhgmfcwc-auth-token` (session JSON raw, @supabase/ssr)
- Plan test : `entreprise` (toutes features débloquées)
- Données seedées : 2 comptes, 20 transactions, 5 factures, 5 factures clients, 3 clients, 10 anomalies, 3 déclarations TVA, 5 alertes
- Nettoyage : toutes données et utilisateur test supprimés après les tests
- `⚠️ SKIP /api/transactions` : route inexistante par design — les transactions passent par le client Supabase JS directement
