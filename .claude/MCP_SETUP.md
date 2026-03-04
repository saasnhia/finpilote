# MCP Servers — Worthifast

Quatre MCP (Model Context Protocol) servers configurés pour enrichir Claude Code sur ce projet.
Config stockée dans `~/.claude.json` (scope: local, jamais commité).

---

## 1. Supabase MCP

**Package :** `@supabase/mcp-server-supabase` v0.6.3
**Rôle :** Accès direct à la base Supabase — lecture/écriture des tables, inspection du schéma, exécution de requêtes SQL, gestion des migrations.

**Ce que ça apporte à Worthifast :**
- Inspecter et interroger les 33 tables (factures, transactions, tva, rapprochements…) sans quitter Claude Code
- Valider des migrations SQL avant déploiement
- Débugger des données en production de manière sécurisée

**Variables d'environnement :**
```
SUPABASE_URL=https://jwaqsszcaicikhgmfcwc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<voir .env.local>
```

**Commande pour ajouter :**
```bash
claude mcp add supabase --scope local \
  -e "SUPABASE_URL=https://jwaqsszcaicikhgmfcwc.supabase.co" \
  -e "SUPABASE_SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2)" \
  -- npx -y @supabase/mcp-server-supabase
```

**Test de connexion :**
```bash
curl -s "https://jwaqsszcaicikhgmfcwc.supabase.co/rest/v1/?apikey=<SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" | python -c "import sys,json; print(len(json.load(sys.stdin).get('definitions',{})), 'tables')"
```
> Résultat attendu : `33 tables`

---

## 2. Playwright MCP

**Package :** `@executeautomation/playwright-mcp-server` v1.0.12
**Rôle :** Contrôle de navigateur headless — navigation, screenshots, interactions UI, tests E2E depuis les prompts Claude.

**Ce que ça apporte à Worthifast :**
- Prendre des screenshots de l'application déployée sur Vercel pour valider les UIs
- Exécuter des scénarios de navigation (login, upload facture, calcul TVA) à la demande
- Débugger des flaky tests en observant le comportement réel

**Variables d'environnement :**
```
BASE_URL=https://worthifast.vercel.app
```

**Commande pour ajouter :**
```bash
claude mcp add playwright --scope local \
  -e "BASE_URL=https://worthifast.vercel.app" \
  -- npx -y @executeautomation/playwright-mcp-server
```

**Test de connexion :**
```bash
node -e "
const { chromium } = require('@playwright/test');
chromium.launch({ headless: true }).then(async b => {
  const p = await b.newPage();
  await p.goto('https://worthifast.vercel.app');
  console.log(await p.title());
  await b.close();
});"
```
> Screenshot sauvegardé dans `tests/screenshots/homepage-mcp-test.png`

---

## 3. Context7 MCP

**Package :** `@upstash/context7-mcp` v2.1.2
**Rôle :** Documentation technique à jour pour Next.js, React, Supabase, Tailwind, TypeScript — résout les docs de la version exacte utilisée dans le projet.

**Ce que ça apporte à Worthifast :**
- Références API Next.js 15 App Router (useRouter, Server Actions, dynamic params…)
- Documentation Supabase SDK à jour (RLS, auth helpers, realtime…)
- Évite les erreurs de version en consultant les docs exactes

**Variables d'environnement :** aucune requise

**Commande pour ajouter :**
```bash
claude mcp add context7 --scope local -- npx -y @upstash/context7-mcp
```

**Test de connexion :**
```bash
npm show @upstash/context7-mcp version
```
> Résultat attendu : `2.1.2` (ou plus récent)

**Usage dans les prompts :**
> "use context7" au début d'un prompt pour que Claude consulte la doc officielle

---

## 4. GitHub MCP

**Package :** `@modelcontextprotocol/server-github` v2025.4.8
**Rôle :** Accès à l'API GitHub — lecture des commits, issues, PRs, branches, recherche de code dans le repo saasnhia/worthifast.

**Ce que ça apporte à Worthifast :**
- Consulter l'historique git et les PRs sans quitter Claude Code
- Créer des issues directement depuis un prompt de debug
- Rechercher du code dans les branches distantes
- Synchroniser les releases et tags

**Variables d'environnement :**
```
GITHUB_TOKEN=<gh auth token>
```

**Commande pour ajouter :**
```bash
claude mcp add github --scope local \
  -e "GITHUB_TOKEN=$(gh auth token)" \
  -- npx -y @modelcontextprotocol/server-github
```

**Test de connexion :**
```bash
gh api repos/saasnhia/worthifast/commits --jq '.[0:5] | .[] | "- " + .sha[0:7] + " " + (.commit.message | split("\n")[0])'
```
> Derniers commits du repo listés

---

## Configuration complète (réinstallation)

Si la config est perdue, relancer ces 4 commandes depuis la racine du projet :

```bash
# 1 — Supabase
claude mcp add supabase --scope local \
  -e "SUPABASE_URL=https://jwaqsszcaicikhgmfcwc.supabase.co" \
  -e "SUPABASE_SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2)" \
  -- npx -y @supabase/mcp-server-supabase

# 2 — Playwright
claude mcp add playwright --scope local \
  -e "BASE_URL=https://worthifast.vercel.app" \
  -- npx -y @executeautomation/playwright-mcp-server

# 3 — Context7
claude mcp add context7 --scope local -- npx -y @upstash/context7-mcp

# 4 — GitHub
claude mcp add github --scope local \
  -e "GITHUB_TOKEN=$(gh auth token)" \
  -- npx -y @modelcontextprotocol/server-github
```

> Les MCPs sont stockés dans `~/.claude.json` (scope local) — ils s'appliquent uniquement à ce projet.
> Ne jamais commiter les clés API. `.claude/mcp.json` et `.claude/settings.local.json` sont dans `.gitignore`.
