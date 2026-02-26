# TODO — Saisie manuelle de factures clients (AR)

## Contexte
Un expert-comptable crée des factures pour ses clients (Accounts Receivable).
Actuellement, `/factures` ne permet que l'import OCR de factures fournisseurs (AP).
Il n'y a aucun moyen de créer une facture client manuellement dans l'interface.

## Problème actuel
- `/factures` = upload OCR fournisseur uniquement
- Les factures clients (FAC-2026-001..040) ne sont visibles QUE dans `/notifications`
- Pas de formulaire de création de facture client
- Pas de numérotation automatique
- Pas d'envoi PDF au client

## Fonctionnalités requises

### Création facture client
- [ ] Formulaire : client (sélection depuis la liste), date, échéance, lignes (qté × PU HT × TVA)
- [ ] Numérotation automatique : FAC-YYYY-NNN
- [ ] Calcul automatique HT → TVA → TTC
- [ ] Sauvegarde dans `factures_clients`

### Liste unifiée factures
- [ ] Vue `/factures` avec deux onglets : "Fournisseurs (OCR)" et "Clients (AR)"
- [ ] Filtres sur les deux : statut, période, montant, client/fournisseur
- [ ] Export CSV/Excel

### Envoi facture par email
- [ ] Génération PDF (Factur-X / EN16931 — déjà conforme selon la bannière)
- [ ] Envoi via Resend avec template personnalisable
- [ ] Suivi lecture (tracking pixel V2)

### Rappels automatiques
- [ ] Déjà partiellement présent dans `/notifications`
- [ ] Intégrer dans la vue factures client

## Estimation
- Priorité : CRITIQUE (fonctionnalité de base manquante)
- Effort : 4-5 jours dev
- Plan : Starter et au-dessus
