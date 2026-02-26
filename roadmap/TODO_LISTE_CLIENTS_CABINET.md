# TODO — Vue clients cabinet dédiée

## Contexte
En tant qu'expert-comptable gérant 45 dossiers clients, Jean-Pierre Moreau a besoin
d'une vue `/clients` dédiée, distincte de `/notifications` (qui ne montre que les retards).

## Problème actuel
- La route `/clients` n'existe pas → 404
- Les clients ne sont visibles que via `/notifications` (filtré sur les factures en retard)
- Pas de vue globale de tous les clients avec leur santé financière

## Fonctionnalités requises

### Vue liste clients (`/clients`)
- [ ] Tableau de tous les clients avec : nom, secteur, CA annuel, nb factures, statut global
- [ ] Filtres : secteur, statut (actif/inactif), ville
- [ ] Tri par CA, nom, nombre de factures en retard
- [ ] Barre de recherche
- [ ] Badge statut : ✅ RAS / ⚠️ Retard / 🔴 Contentieux

### Fiche client (`/clients/[id]`)
- [ ] Informations générales (SIREN, adresse, contact)
- [ ] Liste des factures (toutes, avec filtres statut)
- [ ] Graphique CA sur 12 mois
- [ ] Solde comptable (créances)
- [ ] Historique rappels envoyés
- [ ] Documents associés

### Intégration dashboard Cabinet
- [ ] KPI "Clients actifs" (actuellement "Dossiers actifs")
- [ ] Résumé par client dans la vue cabinet

## Estimation
- Priorité : HAUTE (critique pour adoption cabinet)
- Effort : 3-4 jours dev
- Plan : Cabinet
