# Installer Rozi sur rosy.rimiscky.fr

Ce guide prépare une installation depuis GitHub. Il ne signifie pas que le sous-domaine est déjà configuré ou que l'application a été publiée.

## Vérifier l'hébergement

Rozi utilise Next.js, Node.js et PostgreSQL. Ce n'est pas un site HTML statique ou PHP. Copier le dépôt dans `public_html` ne lance pas l'application.

L'offre d'hébergement doit permettre :

- un processus Node.js persistant (Node.js 24 recommandé) ;
- l'installation des dépendances et la compilation ;
- une connexion à une base PostgreSQL dédiée, locale au serveur ou hébergée séparément ;
- le routage HTTPS de `rosy.rimiscky.fr` vers l'application Node.js ;
- la configuration de variables d'environnement privées et le redémarrage de l'application.

Ces capacités n'ont pas encore été vérifiées sur le compte d'hébergement. Si le panneau propose uniquement PHP/MySQL et le dépôt de fichiers, demander à l'hébergeur une offre prenant en charge Node.js, ou utiliser un hébergement Node.js séparé avec ce sous-domaine.

## Emplacement du code

Le dossier web indiqué est `/home/u179249626/domains/rimiscky.fr/public_html/rosy`.

Pour un serveur web classique, garder les sources et les secrets hors de ce dossier public, par exemple dans `/home/u179249626/apps/rosy`, puis configurer le sous-domaine comme proxy vers Node.js. Ne pas publier `.env`, `.git`, des sauvegardes ou des identifiants dans un dossier servi comme fichiers statiques.

Si le gestionnaire d'applications Node.js de l'hébergeur impose le dossier indiqué, l'utiliser uniquement après avoir confirmé qu'il exécute l'application et ne sert pas les fichiers sources directement. La configuration exacte dépend de l'offre d'hébergement.

## Récupérer le dépôt

Pour un nouveau dossier privé vide :

```sh
mkdir -p /home/u179249626/apps
git clone https://github.com/Rimiscky/Rozi.git /home/u179249626/apps/rosy
cd /home/u179249626/apps/rosy
npm ci
cp .env.example .env
chmod 600 .env
```

Ne pas écraser une installation existante. Si le dépôt est déjà présent, vérifier `git status`, sauvegarder la base, puis utiliser `git pull --ff-only`.

## Configuration privée

Créer une base PostgreSQL de test vide et un utilisateur dédié. Renseigner dans `.env` ou dans le gestionnaire de variables de l'hébergement :

| Variable | Valeur attendue |
| --- | --- |
| `DATABASE_URL` | Adresse PostgreSQL fournie par l'hébergeur, avec son mode TLS requis |
| `AUTH_SECRET` | Secret aléatoire unique pour cette installation |
| `AUTH_URL` | `https://rosy.rimiscky.fr` |
| `INITIAL_ADMIN_USERNAME` | Identifiant du propriétaire pour les tests |
| `INITIAL_ADMIN_PASSWORD` | Nouveau mot de passe de 12 caractères minimum |
| `SEED_DEMO_DATA` | `false`, ou `true` pour des produits fictifs dans cette base de test |
| `TZ` | `Europe/Paris`, à définir dans l'environnement du processus Node.js |

Générer le secret avec `openssl rand -base64 48`. Conserver cette valeur dans la configuration privée uniquement. Ne pas utiliser les identifiants du Mac ou une copie de ses données pour la démonstration.

`POSTGRES_PASSWORD` dans le fichier d'exemple sert uniquement au conteneur Docker PostgreSQL fourni avec le dépôt. Pour une base gérée, utiliser les paramètres donnés par son fournisseur.

## Initialiser et compiler

```sh
npm run db:generate
npx prisma migrate deploy
npm run db:seed
npm run build
```

L'initialisation crée les catégories, les unités et le premier administrateur. Elle ne remplace pas le mot de passe d'un administrateur déjà existant. Ne pas la relancer automatiquement à chaque démarrage. Après la création du compte, retirer le mot de passe initial de l'environnement si aucun nouvel amorçage n'est prévu.

## Démarrer et relier le sous-domaine

Configurer le gestionnaire Node.js de l'hébergeur avec la racine du projet, la commande de compilation `npm run db:generate && npm run build` et la commande de démarrage `npm run start`. Utiliser le port attribué par l'hébergeur et activer le redémarrage automatique.

Sur un serveur administré avec un proxy local, un exemple de démarrage est :

```sh
NODE_ENV=production TZ=Europe/Paris npm run start -- --hostname 127.0.0.1 --port 3000
```

Cette commande doit être gérée par un superviseur pour continuer après la fermeture de SSH. Le proxy doit transmettre le domaine d'origine et le protocole HTTPS à l'application. Le sous-domaine est servi à la racine `/`, sans ajouter `/rosy` dans les URL.

Créer ou vérifier le DNS du sous-domaine selon les valeurs fournies par l'hébergeur, activer son certificat HTTPS, puis tester la connexion, la création d'un produit, une entrée, une sortie et les rapports avec des données fictives.

## Mises à jour

Avant chaque mise à jour, sauvegarder PostgreSQL et conserver une copie de la configuration privée hors du dossier public.

```sh
git pull --ff-only
npm ci
npm run db:generate
npx prisma migrate deploy
npm run build
```

Redémarrer ensuite le processus Node.js depuis le panneau de l'hébergeur et vérifier la connexion. Ne pas exécuter `prisma migrate reset` sur la base utilisée par l'application.

## Option Vercel

Le dépôt comprend aussi `vercel.json` et `npm run build:vercel`, qui génèrent Prisma, appliquent les migrations puis compilent Next.js. Chaque environnement doit avoir sa propre base et ses propres secrets. Ne pas utiliser les paramètres locaux pour une publication Vercel.
