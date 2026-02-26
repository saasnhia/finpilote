# TODO — Dashboard multi-dossiers Cabinet

## Contexte
Un cabinet comptable gère plusieurs dossiers clients (ex: 45 pour Cabinet Moreau).
Le dashboard actuel n'offre pas de vue consolidée par dossier.

## Problème actuel
- "Dossiers actifs : 1" mais pas de liste cliquable des dossiers
- KPI "TVA du mois : Aucune décl." alors que 8 déclarations existent
  → Bug : filtre sur le mois courant trop restrictif (devrait afficher les brouillons en attente)
- "Factures en retard : 1" → compte les factures FOURNISSEURS, pas les factures CLIENTS
  → Confusion entre AP (achats) et AR (ventes) dans le KPI cabinet
- Pas de navigation rapide entre dossiers
- Pas de résumé santé financière par client

## Fonctionnalités requises

### Vue multi-dossiers
- [ ] Liste des dossiers clients avec KPIs rapides (CA, nb factures, alertes)
- [ ] Navigation rapide (sidebar ou onglets)
- [ ] Vue consolidée : total CA géré, total TVA, total factures

### Correction KPIs dashboard cabinet
- [ ] "Factures en retard" → compter `factures_clients` (AR), pas `factures` (AP)
- [ ] "TVA du mois" → afficher les brouillons en attente, pas seulement les validées du mois
- [ ] Ajouter KPI : "CA clients géré ce mois" (somme des factures clients)

### Switching de dossier
- [ ] Sélecteur de dossier dans le header
- [ ] Filtrage de toutes les données par dossier sélectionné

## Estimation
- Priorité : HAUTE
- Effort : 5-7 jours dev
- Plan : Cabinet
