# Plan : Système de Notifications de Paiement & Rappels Email

## Architecture Globale

### Nouvelles tables Supabase (3 tables)

1. **`clients`** — Répertoire des clients
   - `id`, `user_id`, `nom`, `email`, `telephone`, `adresse`, `siren`, `notes`
   - RLS: `auth.uid() = user_id`

2. **`factures_clients`** — Factures émises aux clients (factures de vente, pas les factures fournisseurs existantes)
   - `id`, `user_id`, `client_id` (FK → clients), `numero_facture`, `montant_ht`, `tva`, `montant_ttc`
   - `date_emission`, `date_echeance`, `statut_paiement` ('en_attente' | 'payee' | 'en_retard' | 'partiellement_payee')
   - `montant_paye`, `date_dernier_paiement`, `notes`
   - RLS: `auth.uid() = user_id`

3. **`rappels_email`** — Historique des emails de rappel envoyés
   - `id`, `user_id`, `facture_client_id` (FK → factures_clients), `client_id` (FK → clients)
   - `type_rappel` ('rappel_7j' | 'rappel_15j' | 'rappel_30j' | 'mise_en_demeure' | 'manuel')
   - `email_destinataire`, `sujet`, `contenu`, `statut_envoi` ('envoye' | 'echoue' | 'en_attente')
   - `resend_message_id`, `date_envoi`, `erreur`
   - RLS: `auth.uid() = user_id`

### Fichiers à créer

| # | Fichier | Description |
|---|---------|-------------|
| 1 | `supabase/migrations/005_payment_notifications.sql` | Migration SQL (3 tables + RLS + indexes + triggers) |
| 2 | `src/types/index.ts` | Ajouter types Client, FactureClient, RappelEmail, NotificationStats |
| 3 | `src/hooks/useNotifications.ts` | Hook: fetch factures en retard, stats, actions CRUD |
| 4 | `src/lib/email-templates.ts` | 4 templates email en français (7j, 15j, 30j, mise en demeure) |
| 5 | `src/app/api/notifications/overdue/route.ts` | GET: Détecter factures en retard + stats |
| 6 | `src/app/api/notifications/send-reminder/route.ts` | POST: Envoyer un email de rappel via Resend |
| 7 | `src/app/api/notifications/cron/route.ts` | GET: Job CRON quotidien — détection + envoi auto |
| 8 | `src/app/api/notifications/clients/route.ts` | GET/POST: CRUD clients |
| 9 | `src/app/api/notifications/factures/route.ts` | GET/POST: CRUD factures clients |
| 10 | `src/app/api/notifications/factures/[id]/route.ts` | PATCH: Mise à jour statut paiement |
| 11 | `src/app/notifications/page.tsx` | Page principale Notifications |
| 12 | `src/components/notifications/NotificationBadge.tsx` | Badge compteur pour Sidebar |
| 13 | `src/components/notifications/OverdueTable.tsx` | Tableau des factures en retard |
| 14 | `src/components/notifications/ReminderHistory.tsx` | Historique des rappels envoyés |
| 15 | `src/components/notifications/ClientFormModal.tsx` | Modal ajout/édition client |
| 16 | `src/components/notifications/InvoiceFormModal.tsx` | Modal ajout facture client |
| 17 | `src/components/notifications/SendReminderModal.tsx` | Modal confirmation + preview envoi email |
| 18 | `vercel.json` | Config cron job quotidien |

### Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `src/components/layout/Sidebar.tsx` | Ajouter section "Notifications" avec NotificationBadge |
| `package.json` | Ajouter dépendance `resend` |

## Ordre d'implémentation

### Étape 1 — Base de données & Types
- `005_payment_notifications.sql` : 3 tables, RLS, indexes, triggers updated_at
- `src/types/index.ts` : Ajouter interfaces Client, FactureClient, RappelEmail

### Étape 2 — API Routes (backend)
- `/api/notifications/clients/route.ts` : CRUD clients
- `/api/notifications/factures/route.ts` : CRUD factures clients
- `/api/notifications/factures/[id]/route.ts` : PATCH statut paiement
- `/api/notifications/overdue/route.ts` : Détection retards avec 3 niveaux (7j, 15j, 30j+)
- `/api/notifications/send-reminder/route.ts` : Envoi email via Resend
- `/api/notifications/cron/route.ts` : Job automatique quotidien

### Étape 3 — Email
- `npm install resend`
- `src/lib/email-templates.ts` : 4 templates professionnels FR
- Intégrer dans send-reminder route

### Étape 4 — Hook + Composants UI
- `src/hooks/useNotifications.ts` : Hook centralisé
- `NotificationBadge.tsx` : Badge compteur (rouge)
- `OverdueTable.tsx` : Tableau filtrable avec niveaux d'urgence
- `ReminderHistory.tsx` : Log des emails envoyés
- `ClientFormModal.tsx` : Ajout client
- `InvoiceFormModal.tsx` : Ajout facture client
- `SendReminderModal.tsx` : Preview + envoi email

### Étape 5 — Page Notifications & Sidebar
- `src/app/notifications/page.tsx` : Page complète avec tabs (Retards, Clients, Historique)
- `Sidebar.tsx` : Ajouter item Notifications avec badge dynamique

### Étape 6 — Cron
- `vercel.json` : Configurer cron quotidien (/api/notifications/cron)

## Niveaux d'urgence

| Niveau | Jours de retard | Couleur | Action auto |
|--------|----------------|---------|-------------|
| Léger | 1–7 jours | `gold-500` (jaune) | Rappel courtois |
| Moyen | 8–15 jours | `amber-600` (orange) | Rappel ferme |
| Critique | 16–30 jours | `coral-600` (rouge) | Relance urgente |
| Contentieux | 30+ jours | `red-700` (rouge foncé) | Mise en demeure |

## Service Email : Resend

- SDK simple (`resend` npm package)
- Env var: `RESEND_API_KEY`
- Emails personnalisés avec nom entreprise, détails facture, montant
- Logs de chaque envoi dans `rappels_email`
