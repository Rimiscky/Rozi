# Veille concurrentielle et priorités métier

Cette veille sert à prioriser les fonctions utiles aux petites équipes. Elle ne constitue pas une comparaison commerciale exhaustive.

## Besoins récurrents observés

Les solutions de référence pour TPE et PME convergent sur les mêmes fondamentaux :

1. catalogue par SKU et code-barres ;
2. entrées, sorties, retours et corrections traçables ;
3. seuils de réapprovisionnement et alertes de rupture ;
4. fournisseurs et bons de commande ;
5. import/export tableur ;
6. rôles, permissions et journal d’audit ;
7. indicateurs de valorisation et de rotation ;
8. usage mobile pour le comptage et la réception.

Pour une quincaillerie, il faut en plus prendre en compte un catalogue volumineux, des unités variées (`pièce`, `kg`, `m`, `L`, `sac`) et des références fournisseur distinctes de la référence interne.

## Produits observés

- [Zoho Inventory](https://www.zoho.com/inventory/) : commandes, fournisseurs, suivi par lot/série et intégrations commerciales.
- [inFlow Inventory](https://www.inflowinventory.com/) : achats, ventes, codes-barres et gestion opérationnelle des PME.
- [Sortly](https://www.sortly.com/) : inventaire visuel et usage mobile simplifié.
- [Odoo Inventory](https://www.odoo.com/app/inventory) : opérations de stock, réapprovisionnement et intégration ERP.
- [Ogasys](https://ogasys.com/) : gestion adaptée aux quincailleries et centres de matériaux.

## Positionnement retenu pour Rozi

Rozi ne cherche pas à reproduire un ERP complet. La priorité est un outil plus simple pour une petite équipe : stock fiable, opérations rapides sur téléphone, traçabilité et alertes actionnables.

### Priorité 1 — fiabilité opérationnelle

- protéger les écritures concurrentes ;
- rendre les historiques append-only ;
- conserver un audit des actions sensibles ;
- tester les transactions avec PostgreSQL réel.

### Priorité 2 — réapprovisionnement

- structurer les fournisseurs ;
- créer et recevoir des bons de commande ;
- afficher ruptures, seuils et couverture de stock.

### Priorité 3 — adoption

- importer un catalogue CSV contrôlé ;
- exporter les données sans risque de formule tableur ;
- proposer une démonstration uniquement avec des données fictives.

## Principes de décision

- Une fonction doit réduire une erreur, une rupture, une double saisie ou un temps d’exécution mesurable.
- Les données financières ne sont pas présentées comme comptables sans historique de coût et règles de valorisation.
- Les quantités de différentes unités ne sont jamais additionnées dans un indicateur global trompeur.
- Les fonctions avancées restent hors périmètre tant que le socle stock, audit et achats n’est pas prouvé par des tests.

Dernière mise à jour : septembre 2026.