# n8n — Outil OPS Fondateur UNIQUEMENT

> **IMPORTANT : n8n n'est PAS une fonctionnalité cabinet.**
> Les automatisations métier (rapprochement, alertes, emails) sont **natives dans FinSoft**.
> n8n sert uniquement au fondateur pour monitorer l'infrastructure en production.

---

## Architecture

```
AVANT (❌ mauvaise approche)           APRÈS (✅ approche actuelle)
────────────────────────────           ─────────────────────────────
FinSoft → n8n → Cegid sync            FinSoft → API Cegid directement
FinSoft → n8n → email alertes         FinSoft → Resend (natif)
FinSoft → n8n → rapprochement         FinSoft → matching natif (auto-match.ts)
n8n → FinSoft webhooks (RLS bypass!)  ❌ SUPPRIMÉ — faille de sécurité
```

**Règle absolue :** Les webhooks entrants (n8n → FinSoft) ne doivent JAMAIS exister.
Ils acceptaient `user_id` dans le body, contournant Supabase RLS.

---

## Automatisations natives (FinSoft)

| Feature | Implémentation | Fichier |
|---|---|---|
| Rapprochement après import bancaire | Synchrone dans la route API | `src/lib/matching/auto-match.ts` |
| Email alertes critiques | Resend via `email-sender.ts` | `src/app/api/alerts/route.ts` |
| Génération alertes hebdo | Vercel Cron (lundi 9h) | `src/app/api/alerts/auto/route.ts` |
| Rappels paiement quotidiens | Vercel Cron (8h tous les jours) | `src/app/api/notifications/cron/route.ts` |

---

## Triggers OPS Fondateur (FinSoft → n8n)

| Événement | Webhook n8n | Fichier |
|---|---|---|
| CRON rappels terminé | `POST /webhook/finsoft/cron-rappels-termine` | `src/lib/n8n/trigger.ts` |
| Erreur critique prod | `POST /webhook/finsoft/erreur-critique` | `src/lib/n8n/trigger.ts` |
| Nouveau lead site | `POST /webhook/finsoft/nouveau-lead` | `src/lib/n8n/trigger.ts` |
| Nouveau cabinet (info) | `POST /webhook/finsoft/nouveau-cabinet` | `src/lib/n8n/trigger.ts` |

Ces triggers sont **fire-and-forget** (échec silencieux, timeout 5s).
Ils ne traitent aucune donnée métier — uniquement des notifications Slack pour le fondateur.

---

## Workflows disponibles

| Fichier | Canal Slack | Déclencheur |
|---|---|---|
| `ops-01-cron-monitoring.json` | `#ops-finsoft` | CRON rappels quotidien |
| `ops-02-erreur-critique.json` | `#ops-finsoft` | Erreur critique prod |
| `ops-03-nouveau-lead.json` | `#leads-finsoft` | Formulaire contact site |

---

## Configuration (fondateur seulement)

Variables dans `.env.local` :
```env
N8N_URL=http://localhost:5678
N8N_WEBHOOK_SECRET=<secret_privé_fondateur>
```

Démarrer n8n (Docker) :
```bash
docker run -it --rm -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=changeme \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

Importer un workflow : n8n → **Workflows → Import from File** → sélectionner un fichier `ops-0*.json`.

---

## Routes de monitoring

| Route | Méthode | Auth | Usage |
|---|---|---|---|
| `/api/health` | GET | Aucune | Ping santé publique |
| `/api/ops/error` | POST | Bearer CRON_SECRET | Reporter une erreur critique → Slack |
| `/api/contact` | POST | Aucune | Formulaire contact → Slack leads |
