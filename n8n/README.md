# FinSoft × n8n — Automatisation workflows cabinets

> Intégration n8n pour automatiser les workflows des cabinets comptables (on-premise, zéro cloud externe).

---

## Prérequis

- [n8n](https://docs.n8n.io) installé et accessible sur `http://localhost:5678`
- FinSoft démarré sur `http://localhost:3000`

Démarrer n8n (Docker) :
```bash
docker run -it --rm -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=changeme \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

---

## Configuration FinSoft

Ajouter dans `.env.local` :

```env
N8N_URL=http://localhost:5678
N8N_WEBHOOK_SECRET=finsoft_n8n_secret_2026
N8N_API_KEY=<clé API n8n — Settings → API Keys>
```

---

## Architecture

```
FinSoft → n8n  (Triggers sortants — fire-and-forget)
n8n → FinSoft  (Webhooks entrants — authentifiés par X-N8N-Secret)
```

### Triggers sortants (FinSoft → n8n)

| Événement FinSoft | Webhook n8n | Fichier source |
|---|---|---|
| CRON rappels terminé | `POST /webhook/finsoft/cron-rappels-termine` | `src/lib/n8n/trigger.ts` |
| Rapport audit IA généré | `POST /webhook/finsoft/audit-rapport-genere` | `src/lib/n8n/trigger.ts` |
| Alertes générées | `POST /webhook/finsoft/alertes-generees` | `src/lib/n8n/trigger.ts` |
| Nouveau dossier cabinet | `POST /webhook/finsoft/nouveau-dossier` | `src/lib/n8n/trigger.ts` |
| Import bancaire terminé | `POST /webhook/finsoft/import-bancaire-termine` | `src/lib/n8n/trigger.ts` |

### Webhooks entrants (n8n → FinSoft)

| Route FinSoft | Méthode | Rôle |
|---|---|---|
| `/api/webhooks/n8n/facture-recue` | POST | Créer une facture fournisseur |
| `/api/webhooks/n8n/sync-cegid` | POST | Importer des transactions Cegid |
| `/api/webhooks/n8n/sync-sage` | POST | Importer une balance Sage |
| `/api/webhooks/n8n/nouveau-client` | POST | Créer un client |
| `/api/webhooks/n8n/status` | GET | Ping de santé |

**Sécurité :** tous les webhooks entrants vérifient l'en-tête `X-N8N-Secret` (valeur = `N8N_WEBHOOK_SECRET`).

---

## Importer les workflows

1. Ouvrir n8n → **Workflows → Import from File**
2. Sélectionner un fichier dans `n8n/workflows/`
3. Configurer les credentials (Slack, Google Drive, Notion…)
4. Activer le workflow

### Workflows disponibles

| Fichier | Description |
|---|---|
| `01-cron-rappels-slack.json` | Rapport quotidien rappels paiement → Slack |
| `02-audit-rapport-gdrive.json` | Sauvegarde rapport audit IA → Google Drive |
| `03-alertes-critiques-email.json` | Email expert-comptable si alertes critiques |
| `04-nouveau-dossier-notion.json` | Fiche client → base Notion du cabinet |
| `05-import-bancaire-rapprochement.json` | Import bancaire → rapprochement auto + Slack |

---

## Développement : tester les webhooks localement

Utiliser [ngrok](https://ngrok.com) ou [localtunnel](https://localtunnel.me) pour exposer FinSoft si n8n tourne dans Docker :

```bash
npx localtunnel --port 3000
# → https://xxx.loca.lt (utiliser cette URL dans N8N_URL côté n8n)
```

Tester un webhook entrant :
```bash
curl -X POST http://localhost:3000/api/webhooks/n8n/facture-recue \
  -H "Content-Type: application/json" \
  -H "X-N8N-Secret: finsoft_n8n_secret_2026" \
  -d '{"fournisseur":"ACME","montant_ttc":1200,"date_facture":"2026-02-24","user_id":"<uid>"}'
```

Vérifier le statut :
```bash
curl http://localhost:3000/api/webhooks/n8n/status
```

---

## Déploiement on-premise

Sur un serveur cabinet (Docker Compose) :
- FinSoft et n8n communiquent sur le réseau Docker interne
- Remplacer `http://localhost:3000` par `http://finpilote-app:3000`
- Remplacer `http://localhost:5678` par `http://n8n:5678`
- Voir `docker-compose.yml` à la racine du projet
