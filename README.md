# Rozi

Application web privée de gestion de stock pour quincaillerie.

## Fonctionnalités V1

- authentification par identifiant et mot de passe ;
- rôles Administrateur et Employé contrôlés côté serveur ;
- produits, catégories, unités et fournisseurs ;
- stock initial avec mouvement automatique ;
- entrées, sorties et ajustements transactionnels ;
- blocage des sorties supérieures au stock ;
- historique filtrable et immuable ;
- alertes de stock faible et de rupture ;
- tableau de bord et rapports par période ;
- interface mobile-first.

## Prérequis

- Node.js 24 ou version LTS compatible ;
- Docker pour PostgreSQL, ou une base PostgreSQL existante.

## Installation locale

1. Installer les dépendances :

   `npm install`

2. Copier `.env.example` vers `.env` et remplacer les valeurs sensibles. Le mot de passe initial doit contenir au moins 12 caractères.

3. Démarrer PostgreSQL :

   `docker compose up -d postgres`

4. Créer les tables et contraintes :

   `npx prisma migrate deploy`

5. Créer l’administrateur initial, les catégories et les unités :

   `npm run db:seed`

6. Lancer Rozi :

   `npm run dev`

Puis ouvrir `http://localhost:3000` et utiliser l’identifiant défini dans `INITIAL_ADMIN_USERNAME`.

## Vérifications

- `npm test` : tests des calculs d’entrée, sortie et ajustement ;
- `npm run typecheck` : vérification TypeScript ;
- `npm run build` : compilation de production.

## Règle de fiabilité

Le stock courant n’est jamais modifié seul. Rozi verrouille l’inventaire du produit, calcule la nouvelle quantité, crée le mouvement et met à jour le stock dans une transaction PostgreSQL unique.
