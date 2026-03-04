# Worthifast — Contexte projet

## Stack technique
- Next.js 16.1.6, TypeScript strict, Tailwind CSS
- Supabase (auth + base de données)
- Vercel (déploiement prod) → worthifast.vercel.app
- Docker pour usage local

## Palette de couleurs
- Primary : #22D3A5 (emerald green)
- Background : #0F172A (dark navy)
- Muted : #94A3B8, #64748B
- Suivre exactement les composants UI existants

## Architecture
- src/app/ → pages (App Router)
- src/components/ → composants réutilisables
- src/lib/ → utilitaires, helpers
- src/app/api/ → routes API
- public/ → assets statiques

## Règles importantes
- TypeScript strict — zéro any
- Toujours vérifier session Supabase dans les API routes
- Ne jamais casser les routes existantes
- npm run build doit passer sans erreur
- Données RGPD : anonymiser avant envoi LLM
- Mistral AI = LLM choisi (hébergé France)
