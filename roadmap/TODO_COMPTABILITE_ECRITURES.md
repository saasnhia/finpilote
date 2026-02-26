# TODO — Module Comptabilité / Écritures PCG

## Contexte
Un expert-comptable travaille au niveau des écritures comptables (journal, grand livre,
balance). FinSoft n'a pas de module de saisie d'écritures comptables PCG.

## Problème actuel
- `/transactions` = transactions bancaires (revenus/dépenses), pas des écritures comptables
- Aucune page "Journal" ou "Grand livre"
- La balance âgée fournisseurs existe (`/audit/balance-agee`) mais pas la balance générale
- Import FEC fonctionne (parser existant) mais pas d'affichage des écritures importées
- Les 80 écritures seedées dans `ecritures_comptables` ne sont accessibles nulle part

## Fonctionnalités requises

### Journal des écritures (`/comptabilite/journal`)
- [ ] Affichage des écritures par journal (Ventes, Achats, Banque, OD)
- [ ] Saisie manuelle d'écritures (débit/crédit, compte PCG, libellé)
- [ ] Équilibre débit = crédit validé en temps réel
- [ ] Export FEC (déjà partiellement implémenté)

### Grand livre (`/comptabilite/grand-livre`)
- [ ] Vue par compte PCG (411, 401, 512, 6xx, 7xx)
- [ ] Cumuls débit/crédit/solde
- [ ] Filtre par période

### Balance générale (`/comptabilite/balance`)
- [ ] Tous les comptes avec soldes débiteurs/créditeurs
- [ ] Vérification équilibre actif/passif
- [ ] Export Excel

### Intégration import FEC
- [ ] Après import FEC, rediriger vers le journal
- [ ] Afficher les écritures importées dans `/comptabilite/journal`

## Estimation
- Priorité : CRITIQUE pour l'adoption cabinet
- Effort : 10-15 jours dev (module complet)
- Plan : Cabinet et Pro
