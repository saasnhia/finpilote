# TODO — Export CERFA CA3 / Envoi DGFiP

## Contexte
Un expert-comptable doit pouvoir exporter la déclaration CA3 au format officiel
et l'envoyer ou la télétransmettre à la DGFiP.

## Problème actuel
- Bouton "Envoyer aux impôts" non fonctionnel (toast "disponible V2")
- Pas d'export PDF formaté CERFA
- Pas d'intégration EDI-TVA pour télétransmission

## Fonctionnalités requises

### Export PDF CERFA 3310-CA3
- [ ] Template PDF fidèle au formulaire officiel CERFA n°10963
- [ ] Pré-remplissage des lignes depuis `lignes_ca3`
- [ ] En-tête cabinet (nom, SIREN, adresse)
- [ ] Signature électronique (V2)
- [ ] Bibliothèque : `pdf-lib` ou `puppeteer` côté serveur

### Télétransmission EDI-TVA
- [ ] Intégration partenaire EDI (ex: Jedeclare.com API)
- [ ] OAuth2 DGFiP (compte professionnel)
- [ ] Accusé de réception et numéro de dépôt
- [ ] Statut "Envoyée" mis à jour automatiquement

### Export Excel récapitulatif
- [ ] Export multi-déclarations sur une période
- [ ] Format : tableau avec toutes les lignes CA3 par mois

## Estimation
- Priorité : HAUTE (bloquant pour usage professionnel)
- Effort : 5-7 jours dev (export PDF) + 10j (EDI)
- Plan : Cabinet et Pro
