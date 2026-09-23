# Architecture fonctionnelle de Rozi — V1

## 1. Objectif de la V1

Rozi est une application privée de gestion de stock pour une quincaillerie. La V1 doit rendre six opérations parfaitement fiables et simples :

1. créer un produit ;
2. enregistrer une entrée ;
3. enregistrer une sortie ;
4. calculer automatiquement le stock disponible ;
5. signaler les stocks faibles et les ruptures ;
6. conserver un historique immuable de chaque opération.

La V1 est un monolithe modulaire Next.js. Les évolutions comme les ventes, factures, codes-barres, plusieurs dépôts et le mode hors connexion ne sont pas développées maintenant.

## 2. Utilisateurs et accès

Aucune page métier n'est publique. L'accès nécessite un identifiant et un mot de passe.

- **Administrateur** : accès complet à la gestion des produits, mouvements, catégories, unités, fournisseurs, utilisateurs, rapports et paramètres.
- **Employé** : consultation du stock, recherche, création d'entrées et de sorties, et consultation des mouvements autorisés.
- Pas d'inscription publique en V1.
- Les comptes sont créés ou désactivés par un administrateur.
- Les mots de passe ne sont jamais conservés en clair.
- Les sessions utilisent des cookies sécurisés, HTTP-only et SameSite.
- Les permissions sont contrôlées côté serveur pour chaque opération sensible.

## 3. Navigation et pages

### Pages publiques

- `/connexion` : formulaire identifiant + mot de passe.

### Pages privées

- `/tableau-de-bord` : indicateurs principaux, alertes et derniers mouvements.
- `/produits` : liste, recherche et filtres.
- `/produits/nouveau` : création d'un produit et de son stock initial.
- `/produits/[id]` : fiche produit et historique associé.
- `/produits/[id]/modifier` : modification des informations descriptives.
- `/entrees/nouvelle` : réception de marchandise.
- `/sorties/nouvelle` : retrait de marchandise.
- `/ajustements/nouveau` : correction justifiée après inventaire.
- `/historique` : journal filtrable des mouvements.
- `/rapports` : synthèse par période.
- `/utilisateurs` : gestion des comptes, réservée aux administrateurs.
- `/parametres/categories` : catégories configurables.
- `/parametres/unites` : unités configurables.
- `/parametres/fournisseurs` : fournisseurs.
- `/parametres` : réglages généraux.

## 4. Navigation mobile-first

### Téléphone

- barre supérieure compacte avec le nom **Rozi** ;
- navigation principale en bas : Accueil, Produits, Entrée, Sortie, Plus ;
- actions principales accessibles au pouce ;
- formulaires sur une colonne ;
- champs et boutons tactiles d'au moins 44 px ;
- tableaux transformés en cartes ou listes lisibles sans défilement horizontal ;
- bouton d'action fixe uniquement lorsqu'il apporte une vraie utilité ;
- validation et messages d'erreur affichés près du champ concerné.

### Tablette et ordinateur

- barre latérale persistante ;
- tableaux complets avec tri et filtres ;
- formulaires centrés avec largeur de lecture confortable ;
- raccourcis Entrée et Sortie toujours visibles.

## 5. Modules fonctionnels

Le projet reste un monolithe, organisé en modules :

- `auth` : connexion, session, contrôle des rôles ;
- `users` : comptes et rôles ;
- `catalog` : produits, catégories, unités, fournisseurs ;
- `inventory` : stock actuel ;
- `movements` : entrées, sorties et ajustements ;
- `dashboard` : indicateurs et graphiques ;
- `reports` : agrégations par période ;
- `audit` : traçabilité des opérations sensibles.

Les pages ne modifient jamais directement le stock. Elles appellent un service serveur unique chargé des mouvements.

## 6. Entités et relations

### User

Compte d'un administrateur ou d'un employé.

- possède plusieurs sessions ;
- crée plusieurs mouvements de stock ;
- peut être désactivé sans supprimer l'historique.

### Product

Article stocké dans la quincaillerie.

- appartient à une catégorie ;
- utilise une unité ;
- peut avoir un fournisseur principal ;
- possède exactement un inventaire courant ;
- possède plusieurs mouvements.

### Category

Classe les produits. Son nom est unique.

### Unit

Définit l'unité de mesure d'un produit : pièce, sac, mètre, litre, etc. Son nom et son symbole sont configurables.

### Supplier

Fournisseur facultatif lié aux produits ou aux entrées.

### Inventory

Projection du stock courant d'un produit.

- relation un-à-un avec Product ;
- conserve la quantité disponible ;
- est mise à jour uniquement dans la même transaction que la création d'un mouvement.

### StockMovement

Journal immuable d'une entrée, d'une sortie ou d'un ajustement.

Il conserve notamment :

- le produit ;
- le type `IN`, `OUT` ou `ADJUSTMENT` ;
- la quantité absolue du mouvement ;
- le stock avant ;
- le stock après ;
- l'écart signé ;
- le motif ;
- la référence ;
- le fournisseur ou le client saisi, si présent ;
- le commentaire ;
- la date effective de l'opération ;
- l'utilisateur qui l'a créée ;
- sa date de création technique.

Un mouvement validé n'est jamais modifié ou supprimé silencieusement. Une erreur est corrigée par un nouveau mouvement d'ajustement.

## 7. Relations principales

- Category 1 → N Product
- Unit 1 → N Product
- Supplier 1 → N Product (facultatif)
- Product 1 → 1 Inventory
- Product 1 → N StockMovement
- User 1 → N StockMovement
- Supplier 1 → N StockMovement (facultatif pour les entrées)

## 8. Règles de calcul du stock

### Entrée

- quantité demandée strictement positive ;
- `stockAfter = stockBefore + quantity` ;
- création du mouvement et mise à jour de l'inventaire dans une transaction unique.

### Sortie

- quantité demandée strictement positive ;
- par défaut, `quantity <= stockBefore` ;
- `stockAfter = stockBefore - quantity` ;
- aucune quantité négative n'est autorisée en V1 ;
- mouvement et inventaire sont enregistrés dans la même transaction.

### Ajustement

L'utilisateur saisit la quantité réellement comptée, pas un nombre à ajouter ou retirer.

- `difference = countedQuantity - stockBefore` ;
- `stockAfter = countedQuantity` ;
- un motif est obligatoire ;
- un ajustement sans différence est refusé afin d'éviter un faux mouvement.

### Stock initial

La création d'un produit crée son inventaire. Si le stock initial est supérieur à zéro, Rozi crée un premier mouvement `IN` avec le motif « Stock initial ». Le stock ne doit jamais apparaître sans origine dans l'historique.

## 9. Cohérence et concurrence

Pour chaque mouvement, le serveur :

1. valide les données et la permission ;
2. ouvre une transaction PostgreSQL ;
3. verrouille la ligne d'inventaire du produit ;
4. relit le stock courant ;
5. refuse une sortie insuffisante ;
6. calcule le nouveau stock ;
7. crée le mouvement avec les valeurs avant et après ;
8. met à jour l'inventaire ;
9. valide la transaction.

Le verrouillage empêche deux employés de retirer simultanément la même quantité à partir d'un ancien stock. En cas d'échec, toute l'opération est annulée.

Une contrainte PostgreSQL interdit une quantité d'inventaire négative. Les opérations sensibles sont validées côté serveur avec Zod.

## 10. États de stock

Les états sont calculés, pas enregistrés séparément :

- **Rupture** : quantité disponible = 0 ;
- **Stock faible** : quantité disponible > 0 et quantité <= seuil d'alerte ;
- **En stock** : quantité > seuil d'alerte.

## 11. Tableau de bord V1

Le premier écran affiche sans surcharge :

- total des produits actifs ;
- somme des quantités disponibles ;
- entrées du jour ;
- sorties du jour ;
- nombre de stocks faibles ;
- nombre de ruptures ;
- derniers mouvements ;
- graphique entrées/sorties sur une période courte ;
- produits les plus sortis.

Sur mobile, les alertes et les boutons Nouvelle entrée / Nouvelle sortie apparaissent avant les graphiques.

## 12. Recherche et rapports

La recherche V1 porte sur le nom, le SKU et la catégorie. Le champ `barcode` est prévu mais facultatif.

L'historique peut être filtré par période, produit, catégorie, type et utilisateur.

Les rapports proposent Aujourd'hui, Cette semaine, Ce mois et une période personnalisée. Les exports CSV, Excel et PDF restent une évolution ultérieure.

## 13. Choix techniques

- Next.js avec TypeScript ;
- Tailwind CSS et composants accessibles ;
- PostgreSQL ;
- Prisma ;
- Zod ;
- Auth.js avec connexion par identifiant et mot de passe ;
- Recharts ;
- tests ciblés sur la logique de stock et les permissions.

## 14. Ordre d'implémentation et commits

Chaque étape terminée est enregistrée dans un commit séparé :

1. `docs: définir l'architecture fonctionnelle de Rozi`
2. `feat: initialiser Next.js et l'interface mobile-first`
3. `feat: ajouter le schéma Prisma et PostgreSQL`
4. `feat: sécuriser la connexion et les rôles`
5. `feat: gérer les catégories unités et fournisseurs`
6. `feat: gérer les produits et le stock initial`
7. `feat: enregistrer les entrées de stock`
8. `feat: enregistrer les sorties de stock`
9. `feat: ajouter les ajustements d'inventaire`
10. `feat: afficher l'historique filtrable`
11. `feat: ajouter les alertes et le tableau de bord`
12. `feat: ajouter les rapports de stock`
13. `test: vérifier les mouvements permissions et accès mobile`

Chaque commit doit rester fonctionnel et compréhensible.
