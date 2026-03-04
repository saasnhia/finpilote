export interface NavigationItem {
  id: string
  label: string
  description: string
  href: string
  icon: string
  keywords: string[]
  group: 'navigation' | 'action'
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  // ── Dashboard ──
  { id: 'dashboard', label: 'Tableau de bord', description: 'KPIs, trésorerie, alertes', href: '/dashboard', icon: '📊', keywords: ['dashboard', 'accueil', 'kpi', 'trésorerie'], group: 'navigation' },
  { id: 'analytique', label: 'Analytique', description: 'Analyse détaillée par axe', href: '/dashboard/analytique', icon: '📈', keywords: ['analytique', 'analyse', 'graphiques'], group: 'navigation' },

  // ── Comptabilité ──
  { id: 'transactions', label: 'Transactions', description: 'Écritures comptables, saisie', href: '/transactions', icon: '📒', keywords: ['transactions', 'écritures', 'saisie', 'comptabilité', 'journal'], group: 'navigation' },
  { id: 'balance', label: 'Balance générale', description: 'Balance des comptes N et N-1', href: '/comptabilite/balance', icon: '⚖️', keywords: ['balance', 'comptes', 'soldes', 'N-1'], group: 'navigation' },
  { id: 'immobilisations', label: 'Immobilisations', description: 'Gestion des immobilisations et amortissements', href: '/dashboard/immobilisations', icon: '🏢', keywords: ['immobilisations', 'amortissements', 'actifs'], group: 'navigation' },
  { id: 'liasses', label: 'Liasses fiscales', description: 'Liasses et états financiers', href: '/dashboard/liasses', icon: '📑', keywords: ['liasses', 'bilan', 'compte de résultat', 'états financiers'], group: 'navigation' },
  { id: 'notes-frais', label: 'Notes de frais', description: 'Saisie et suivi des notes de frais', href: '/dashboard/notes-de-frais', icon: '🧾', keywords: ['notes de frais', 'dépenses', 'remboursement'], group: 'navigation' },

  // ── Facturation ──
  { id: 'factures', label: 'Factures', description: 'Factures fournisseurs (OCR) et clients', href: '/factures', icon: '🧾', keywords: ['factures', 'facturation', 'clients', 'fournisseurs', 'ocr'], group: 'navigation' },
  { id: 'commercial', label: 'Commercial', description: 'Devis, factures, avoirs, catalogue', href: '/commercial', icon: '📋', keywords: ['devis', 'commercial', 'avoirs', 'catalogue', 'abonnements'], group: 'navigation' },
  { id: 'einvoicing', label: 'E-invoicing', description: 'Facturation électronique Factur-X 2026', href: '/comptabilite/factures/einvoicing', icon: '⚡', keywords: ['e-invoicing', 'factur-x', 'dématérialisation', '2026', 'électronique'], group: 'navigation' },

  // ── Banque ──
  { id: 'banques', label: 'Comptes bancaires', description: 'Gestion des comptes et IBAN', href: '/parametres/banques', icon: '🏦', keywords: ['banque', 'compte', 'iban', 'virement'], group: 'navigation' },
  { id: 'rapprochement', label: 'Rapprochement bancaire', description: 'Rapprochement automatique des transactions', href: '/rapprochement', icon: '🔄', keywords: ['rapprochement', 'bancaire', 'pointage', 'lettrage'], group: 'navigation' },
  { id: 'import-releve', label: 'Import relevé bancaire', description: 'Import CSV, OFX, QIF — jusqu\'à 50 Mo', href: '/import-releve', icon: '📤', keywords: ['import', 'relevé', 'csv', 'ofx', 'bancaire'], group: 'navigation' },
  { id: 'tresorerie', label: 'Trésorerie', description: 'Suivi et prévisions de trésorerie', href: '/entreprise/tresorerie', icon: '💰', keywords: ['trésorerie', 'cash', 'prévisions', 'solde'], group: 'navigation' },

  // ── Relances ──
  { id: 'relances', label: 'Relances impayés', description: 'Suivi et relances automatiques J+7, J+30', href: '/relances', icon: '🔔', keywords: ['relances', 'impayés', 'recouvrement', 'retard'], group: 'navigation' },
  { id: 'relances-config', label: 'Configuration relances', description: 'Paramétrage des niveaux de relance', href: '/relances/configuration', icon: '⚙️', keywords: ['relances', 'configuration', 'niveaux', 'email'], group: 'navigation' },

  // ── Fiscalité ──
  { id: 'tva', label: 'Déclaration TVA', description: 'CA3, CA12 — calcul et export', href: '/tva', icon: '🏛️', keywords: ['tva', 'déclaration', 'ca3', 'ca12', 'fiscal'], group: 'navigation' },
  { id: 'nouvelle-declaration', label: 'Nouvelle déclaration TVA', description: 'Créer une déclaration TVA', href: '/tva/nouvelle-declaration', icon: '📝', keywords: ['tva', 'nouvelle', 'déclaration', 'créer'], group: 'navigation' },

  // ── Audit ──
  { id: 'audit-seuils', label: 'Audit — Seuils', description: 'Contrôle des seuils comptables', href: '/audit/seuils', icon: '🛡️', keywords: ['audit', 'seuils', 'contrôle', 'anomalies'], group: 'navigation' },
  { id: 'audit-comptes', label: 'Audit — Comptes', description: 'Revue des comptes et écarts', href: '/audit/comptes', icon: '🔍', keywords: ['audit', 'comptes', 'revue', 'écarts'], group: 'navigation' },
  { id: 'balance-agee', label: 'Balance âgée', description: 'Analyse de l\'ancienneté des créances', href: '/audit/balance-agee', icon: '📊', keywords: ['balance âgée', 'créances', 'ancienneté', 'aging'], group: 'navigation' },

  // ── IA ──
  { id: 'ia', label: 'Assistant IA', description: 'PCG, BOFIP, agents comptables IA', href: '/ia', icon: '🤖', keywords: ['assistant', 'ia', 'pcg', 'bofip', 'cgi', 'fiscal', 'intelligence artificielle'], group: 'navigation' },
  { id: 'agents', label: 'Mes agents IA', description: 'Agents personnalisés comptabilité/fiscal', href: '/ia/mes-agents', icon: '⚡', keywords: ['agents', 'ia', 'automatisation', 'personnalisé'], group: 'navigation' },
  { id: 'creer-agent', label: 'Créer un agent IA', description: 'Nouveau agent IA personnalisé', href: '/ia/creer-agent', icon: '➕', keywords: ['créer', 'agent', 'ia', 'nouveau'], group: 'navigation' },

  // ── Portail client ──
  { id: 'portail', label: 'Portail client', description: 'Espace partagé sécurisé avec vos clients', href: '/portail', icon: '👥', keywords: ['portail', 'client', 'partage', 'documents'], group: 'navigation' },

  // ── Cabinet ──
  { id: 'cabinet', label: 'Multi-dossiers', description: 'Gestion des dossiers cabinet', href: '/cabinet', icon: '🗂️', keywords: ['cabinet', 'dossiers', 'multi', 'clients'], group: 'navigation' },
  { id: 'automatisation', label: 'Automatisation', description: 'Règles et logs d\'automatisation', href: '/automatisation', icon: '⚙️', keywords: ['automatisation', 'règles', 'auto', 'catégorisation'], group: 'navigation' },

  // ── Paramètres ──
  { id: 'parametres', label: 'Paramètres', description: 'Paramètres généraux du compte', href: '/settings', icon: '⚙️', keywords: ['paramètres', 'settings', 'configuration', 'profil'], group: 'navigation' },
  { id: 'parametres-integrations', label: 'Intégrations', description: 'Sage, Cegid, Chift, connecteurs', href: '/parametres/integrations', icon: '🔌', keywords: ['intégrations', 'sage', 'cegid', 'chift', 'api', 'connecteur'], group: 'navigation' },
  { id: 'parametres-regles', label: 'Règles de catégorisation', description: 'Règles automatiques fournisseurs', href: '/parametres/regles', icon: '📐', keywords: ['règles', 'catégorisation', 'fournisseurs', 'pcg'], group: 'navigation' },
  { id: 'pricing', label: 'Plans & tarifs', description: 'Plans et tarifs Worthifast', href: '/pricing', icon: '💳', keywords: ['prix', 'plans', 'tarifs', 'abonnement', 'pricing'], group: 'navigation' },
  { id: 'notifications', label: 'Notifications', description: 'Centre de notifications', href: '/notifications', icon: '🔔', keywords: ['notifications', 'alertes', 'messages'], group: 'navigation' },
  { id: 'faq', label: 'FAQ / Aide', description: 'Questions fréquentes et aide', href: '/faq', icon: '❓', keywords: ['faq', 'aide', 'help', 'questions', 'support'], group: 'navigation' },

  // ── Actions rapides ──
  { id: 'nouvelle-facture', label: 'Nouvelle facture client', description: 'Créer une facture client', href: '/factures/nouvelle', icon: '➕', keywords: ['créer', 'nouvelle', 'facture', 'client'], group: 'action' },
  { id: 'nouveau-devis', label: 'Nouveau devis', description: 'Créer un devis commercial', href: '/commercial/nouveau/devis', icon: '➕', keywords: ['créer', 'nouveau', 'devis', 'commercial'], group: 'action' },
  { id: 'import-fec', label: 'Importer un FEC', description: 'Import fichier FEC standard', href: '/import-releve', icon: '📥', keywords: ['fec', 'import', 'migration', 'sage', 'cegid'], group: 'action' },
]
