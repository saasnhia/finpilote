# Worthifast 🚀

**La solution simple pour piloter la rentabilité de votre entreprise.**

Worthifast est une application SaaS conçue pour remplacer Excel chez les comptables et PME. Calculez votre seuil de rentabilité en 30 secondes et visualisez la santé financière de votre entreprise en un coup d'œil.

![Worthifast Dashboard](https://via.placeholder.com/800x400/102a43/10b981?text=Worthifast+Dashboard)

## ✨ Fonctionnalités

- **📊 Calcul du Seuil de Rentabilité** - Automatique et instantané
- **📈 Dashboard Visuel** - KPIs clés en temps réel
- **💰 Gestion des Transactions** - Revenus et dépenses
- **📉 Graphiques d'Évolution** - Historique sur 6 mois
- **🔐 Authentification Sécurisée** - Google OAuth + Email/Password
- **☁️ Données Synchronisées** - Accessibles partout

## 🛠 Stack Technique

| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 15 | Framework React |
| React | 19 | UI Components |
| TypeScript | 5.6 | Type Safety |
| Tailwind CSS | 3.4 | Styling |
| Supabase | Latest | Auth & Database |
| Recharts | 2.13 | Graphiques |
| Framer Motion | 11 | Animations |
| Lucide React | Latest | Icônes |

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase (gratuit)

### 1. Cloner le projet

```bash
git clone https://github.com/votre-repo/worthifast.git
cd worthifast
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Allez dans **SQL Editor** et exécutez le contenu de `supabase/schema.sql`
3. Configurez l'authentification :
   - **Settings > Authentication > Providers > Google** : Activez et configurez
   - **Settings > Authentication > URL Configuration** : Ajoutez `http://localhost:3000` aux URLs autorisées

### 4. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Éditez `.env.local` avec vos credentials Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📁 Structure du Projet

```
worthifast/
├── src/
│   ├── app/                    # Pages Next.js App Router
│   │   ├── page.tsx            # Landing page
│   │   ├── login/              # Page de connexion
│   │   ├── signup/             # Page d'inscription
│   │   ├── dashboard/          # Dashboard principal
│   │   ├── transactions/       # Gestion des transactions
│   │   ├── settings/           # Paramètres utilisateur
│   │   └── auth/callback/      # Callback OAuth
│   ├── components/
│   │   ├── ui/                 # Composants UI réutilisables
│   │   ├── dashboard/          # Composants du dashboard
│   │   └── layout/             # Header, Footer
│   ├── hooks/                  # Hooks personnalisés
│   ├── lib/                    # Utilitaires et configurations
│   │   ├── supabase/           # Client Supabase
│   │   └── calculations.ts     # Calculs financiers
│   └── types/                  # Types TypeScript
├── supabase/
│   └── schema.sql              # Schéma de base de données
└── public/                     # Assets statiques
```

## 📊 Formules Financières

### Seuil de Rentabilité (SR)

```
SR = Charges Fixes / Taux de Marge sur Coûts Variables
```

### Taux de Marge

```
Taux de Marge = 1 - (Taux de Charges Variables / 100)
```

### Point Mort (en jours)

```
Point Mort = (SR / CA Annuel) × 365
```

### Marge de Sécurité

```
Marge de Sécurité = CA - SR
Marge de Sécurité (%) = (CA - SR) / CA × 100
```

## 🔐 Authentification

Worthifast utilise Supabase Auth avec :

- **Google OAuth** - Connexion en un clic
- **Email/Password** - Inscription classique avec confirmation par email
- **Session persistante** - Restez connecté
- **RLS (Row Level Security)** - Données protégées par utilisateur

## 🎨 Personnalisation

### Couleurs

Les couleurs sont définies dans `tailwind.config.ts` :

- `navy` - Couleur principale (texte, backgrounds)
- `emerald` - Succès, accents positifs
- `coral` - Erreurs, accents négatifs
- `gold` - Avertissements, éléments neutres

### Polices

- **Outfit** - Titres et display
- **Plus Jakarta Sans** - Corps de texte
- **JetBrains Mono** - Nombres et code

## 🚢 Déploiement

### Vercel (Recommandé)

1. Connectez votre repo GitHub à Vercel
2. Ajoutez les variables d'environnement dans Vercel
3. Déployez !

### Autres plateformes

```bash
npm run build
npm run start
```

## 📝 Roadmap

- [ ] Export PDF des rapports
- [ ] Mode multi-entreprises
- [ ] Import de données bancaires
- [ ] Prévisions automatiques avec IA
- [ ] Application mobile

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

---

Fait avec ❤️ à Dijon pour les comptables et PME de France.
