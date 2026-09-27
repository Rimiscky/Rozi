# Rozi

Application web privée de gestion de stock conçue pour les quincailleries et les petits commerces techniques. Rozi transforme les entrées, sorties et inventaires en un registre traçable afin de réduire les ruptures, les écarts de stock et les décisions prises à l’aveugle.

> État : MVP fonctionnel. Les paiements, la facturation et la comptabilité ne sont pas inclus.

## Problème métier traité

Les quincailleries gèrent souvent de nombreuses références vendues dans des unités différentes. Rozi fournit une source de vérité simple pour répondre à trois questions opérationnelles : **que reste-t-il**, **pourquoi la quantité a-t-elle changé** et **quels produits faut-il réapprovisionner**.

## Fonctionnalités

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

## Choix techniques vérifiables

- **Next.js 16 et TypeScript** pour l’interface et les actions serveur ;
- **PostgreSQL et Prisma** pour les contraintes, relations et transactions ;
- transaction atomique et verrou PostgreSQL `FOR UPDATE` pour sérialiser les mouvements d’un même produit ;
- **Auth.js**, mots de passe bcrypt et contrôle des rôles côté serveur ;
- tests Vitest, vérification TypeScript et compilation dans GitHub Actions.

L’architecture, le modèle de données et les limites sont détaillés dans [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) et [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md). La veille fonctionnelle qui guide la feuille de route se trouve dans [`docs/VEILLE_CONCURRENTIELLE.md`](docs/VEILLE_CONCURRENTIELLE.md).

## Prérequis

- Node.js 20.9 ou version ultérieure ;
- Docker pour PostgreSQL, ou une base PostgreSQL existante.

## Installation locale

1. Installer les dépendances verrouillées :

   `npm ci`

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

GitHub Actions exécute automatiquement ces vérifications à chaque push et pull request vers `main`.

## Démonstration sans données client

Le dépôt ne contient aucune donnée réelle. Pour préparer une démonstration, utilisez une base PostgreSQL isolée, définissez `SEED_DEMO_DATA=true`, puis exécutez `npm run db:seed`. Le jeu idempotent ajoute trois références, un fournisseur et des mouvements explicitement fictifs.

Une démonstration publique ne doit jamais réutiliser une sauvegarde client. Elle doit disposer de comptes et de références dédiés, d’un mot de passe renouvelé et d’une base réinitialisable.

## Limites actuelles

- réception complète des bons de commande uniquement, sans réception partielle ;
- import CSV en création uniquement, sans mise à jour en masse ;
- pas encore de multi-entrepôt ni de lecture code-barres ;
- pas de caisse, facturation, comptabilité ou synchronisation e-commerce ;
- application mono-établissement pour le moment.

Ces limites sont affichées volontairement : Rozi est présenté comme un produit en construction, pas comme un ERP déjà commercialisé.

## Règle de fiabilité

Le stock courant n’est jamais modifié seul. Rozi verrouille l’inventaire du produit, calcule la nouvelle quantité, crée le mouvement et met à jour le stock dans une transaction PostgreSQL unique.
