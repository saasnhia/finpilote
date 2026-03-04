# Worthifast — Rapport de tests E2E Playwright

**Date :** 2026-02-25
**Version testée :** `https://worthifast.vercel.app`
**Outils :** Playwright, Chromium, Firefox

---

## Résultats globaux

| Projet | Tests | Passed | Failed |
|--------|-------|--------|--------|
| Chromium (authentifié) | 58 | 58 | 0 |
| Firefox (authentifié) | 58 | 58 | 0 |
| Auth-tests (non-authentifié) | 9 | 9 | 0 |
| **Total** | **125** | **125** | **0** |

---

## Couverture des tests

### Auth (`tests/auth.spec.ts`) — 9 tests
- ✅ Page `/signup` accessible (accès sur demande)
- ✅ Page login s'affiche avec champs email/mot de passe
- ✅ Login avec mauvais mot de passe → message d'erreur
- ✅ Login avec bons credentials → redirection `/dashboard`
- ✅ `/dashboard` sans session → redirection `/login`
- ✅ `/factures` sans session → redirection `/login`
- ✅ `/login` avec session active → redirection `/dashboard`
- ✅ Déconnexion depuis le menu utilisateur → retour `/login`

### Landing (`tests/landing.spec.ts`) — 5 tests
- ✅ Page d'accueil accessible sans authentification
- ✅ Titre principal (h1) visible
- ✅ Lien vers `/pricing` visible
- ✅ Lien vers `/login` visible
- ✅ Navigation vers `/pricing` fonctionnelle

### Pricing (`tests/pricing.spec.ts`) — 6 tests
- ✅ Page `/pricing` se charge
- ✅ Les 3 plans affichés (Starter, Cabinet, Pro)
- ✅ Prix corrects : 290€ / 890€ / 1900€
- ✅ Toggle Cabinet / Entreprise fonctionne
- ✅ Bouton "S'abonner" sans session → redirect `/login`
- ✅ Bouton "S'abonner" connecté → redirect Stripe Checkout

### Onboarding (`tests/onboarding.spec.ts`) — 4 tests
- ✅ Page `/onboarding` affiche les deux choix (Cabinet / Entreprise)
- ✅ Sélection "Cabinet comptable" → pas d'erreur réseau
- ✅ Sélection "Entreprise/TPE/PME" → pas d'erreur réseau
- ✅ Page paramètres permet de changer le profil

### Dashboard (`tests/dashboard.spec.ts`) — 9 tests
- ✅ Tableau de bord se charge (heading visible)
- ✅ Zone d'import UniversalImportHub visible avec fond clair
- ✅ Boutons d'action principaux présents
- ✅ Export FEC disponible
- ✅ Navigation vers `/transactions` depuis le dashboard
- ✅ KPI cards et indicateurs visibles
- ✅ Sections rapprochement et TVA accessibles depuis le dashboard

### Import (`tests/import.spec.ts`) — 6 tests
- ✅ Zone drag & drop visible avec fond clair (pas de fond noir)
- ✅ Import CSV → état "detecting" ou "detected" visible
- ✅ Import FEC → badge FEC ou bouton "Traiter maintenant"
- ✅ Annuler après détection → retour à l'état idle
- ✅ Import FEC → bouton "Traiter maintenant" disponible
- ✅ Page `/import-releve` accessible

### Factures (`tests/factures.spec.ts`) — 5 tests
- ✅ Page `/factures` accessible
- ✅ Titre ou en-tête "Factures" visible
- ✅ Zone upload ou bouton d'import présent
- ✅ Statistiques ou état vide visible
- ✅ Upload de fichier CSV → feedback de traitement

### Rapprochement (`tests/rapprochement.spec.ts`) — 5 tests
- ✅ Page `/rapprochement` accessible
- ✅ Titre "Rapprochement" visible
- ✅ Bouton "Lancer" visible
- ✅ État vide ou liste de transactions affichée
- ✅ Bouton "Lancer le rapprochement automatique" cliquable → feedback

### TVA (`tests/tva.spec.ts`) — 5 tests
- ✅ Page `/tva` accessible
- ✅ Titre TVA visible
- ✅ Bouton "Nouvelle déclaration" ou état vide visible
- ✅ Liste des déclarations ou état vide affiché
- ✅ KPI ou encadré résumé présent (si données)

### Comptabilité (`tests/comptabilite.spec.ts`) — 8 tests
- ✅ Page `/transactions` accessible
- ✅ Balance âgée mentionnée (accès rapide)
- ✅ Page `/transactions` : liste ou message d'état vide
- ✅ Modal Export FEC s'ouvre depuis le dashboard
- ✅ Navigation vers `/comptabilite` ou section comptable fonctionnelle

---

## Bugs trouvés et corrigés

### 1. Race condition `useSubscription` — redirect prématuré vers `/pricing`
**Fichier :** `src/hooks/useSubscription.ts`, `src/app/dashboard/page.tsx`
**Problème :** `loading=false` quand `user=null` créait une fenêtre où `isActive=false` déclenchait le guard avant que la souscription soit chargée.
**Fix :** Ajout du flag `initialized: boolean`, mis à `true` seulement dans le `finally` du fetch (pas quand `user=null`).

### 2. Onboarding bloqué par le middleware — "Erreur réseau"
**Fichier :** `src/lib/supabase/middleware.ts`
**Problème :** La route `POST /api/onboarding/complete` était interceptée par le middleware (check `onboarding_completed=false`) qui redirige vers HTML → `res.json()` échoue.
**Fix :** Ajout de `/api/onboarding/` dans `PUBLIC_API_PREFIXES`.

### 3. Fonds noirs illisibles dans `UniversalImportHub`
**Fichier :** `src/components/dashboard/UniversalImportHub.tsx`
**Problème :** Tous les états (idle, detecting, detected, done, error) utilisaient `bg-slate-800/40` → fond opaque noir sur les cartes claires.
**Fix :** Migration vers palette claire (`bg-navy-50`, `bg-white`, `bg-emerald-50`, `bg-red-50`), textes en `text-navy-*`.

### 4. Fond noir dans `DepensesChart` (graphique PCG)
**Fichier :** `src/components/entreprise/DepensesChart.tsx`
**Problème :** Container `bg-slate-800/60`, CartesianGrid sombre, tooltip fond noir.
**Fix :** Container `bg-white border-navy-100`, grille `stroke="#E2E8F0"`, tooltip `background: '#ffffff'`.

---

## Tests non-couverts / hors-scope

| Fonctionnalité | Raison |
|---|---|
| Email réel (onboarding invite) | Nécessite boîte mail test + SMTP real |
| Stripe webhooks | Nécessite `stripe listen` en local |
| Intégrations ERP (Cegid/Sage) | OAuth2 réel non disponible en CI |
| Email inbound (documents@cabinet) | Hors-scope MVP (V2) |
| n8n workflows | Serveur n8n externe requis |
| Mobile responsive | Hors-scope sprint actuel |

---

## Infrastructure de test

```
tests/
├── global.setup.ts          # Provision compte test via Supabase Admin API
├── fixtures/
│   ├── auth.ts              # TEST_USER credentials
│   └── helpers.ts           # waitForDashboard(), waitForPageLoad()
├── files/
│   ├── test.csv             # Fichier CSV minimal pour tests import
│   └── test.fec             # Fichier FEC minimal pour tests import
├── auth.spec.ts
├── landing.spec.ts
├── pricing.spec.ts
├── onboarding.spec.ts
├── dashboard.spec.ts
├── import.spec.ts
├── factures.spec.ts
├── rapprochement.spec.ts
├── tva.spec.ts
└── comptabilite.spec.ts
```

**Compte test :** `test@worthifast.dev` / `TestWorthifast2026!`
- Provisionné via Supabase Admin API (email confirmé automatiquement)
- `user_profiles`: `subscription_status='active'`, `onboarding_completed=true`, `profile_type='cabinet'`
- `subscriptions`: plan `pro`, statut `active`, expire +1 an
