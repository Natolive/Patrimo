# Patrimo

**Ton portefeuille, en clair.** Suivre son portefeuille d'actions et d'ETF (PEA, compte-titres…) au même endroit, quel que soit le courtier : ce qu'on a acheté et vendu, ce que ça vaut aujourd'hui, la tendance des valeurs détenues ou surveillées et l'actualité qui les fait bouger.

Les courtiers montrent les positions et les opérations, rarement l'évolution du portefeuille dans le temps, une lecture de tendance des valeurs ou l'actualité de leur marché. Patrimo les rassemble, à partir des avis d'opéré qu'on saisit soi-même.

---

## Ce que fait l'application

### 0. Trouver n'importe quelle valeur — recherche (en haut, ou ⌘K / Ctrl+K)

Nom, code ISIN ou mnémonique : les actions et ETF cotés s'affichent pendant la frappe, avec leur symbole, leur place de cotation (Paris, Francfort…) et leur type. Valider ouvre la **fiche complète** de la valeur, même si on ne la détient ni ne la suit, avec l'encart pour acheter, vendre ou la suivre.

### 1. Saisir ses opérations — page « Opérations »

Pour chaque achat (en vert) ou vente (en rouge) de son avis d'opéré (le document que le courtier envoie après chaque ordre exécuté), et pour chaque dividende reçu (en bleu) :

| Champ | Exemple | Remarque |
|---|---|---|
| Opération | Achat / Vente / Dividende | |
| Valeur | `FR001400U5Q4` ou `DCAM` | Code ISIN de l'avis d'opéré (le plus sûr) ou mnémonique ; le nom retrouvé s'affiche dans la liste pour vérifier |
| Date | 01/10/2026 | |
| Quantité | 45 | Fractions acceptées |
| Prix unitaire | 6,259 | Jusqu'à 3 décimales, virgule ou point |
| Frais | 0 | Courtage ; le total de l'avis d'opéré moins quantité × prix |

- Une vente ne peut porter que sur des titres détenus à sa date.
- **Dividende** : la quantité devient « Titres détenus », le prix « Par titre » (montant brut par titre) et les frais « Retenues » (impôts et prélèvements retenus, 0 s'il n'y en a pas) ; le total est ce qui a été encaissé. Un dividende ne change ni la quantité ni le PRU.
- Le même formulaire est l'encart « Passer un ordre » de chaque fiche, avec la valeur déjà choisie et le prix prérempli au dernier cours.
- La liste se charge au fil du défilement, 20 opérations à la fois, avec des lignes fantômes pendant le chargement (de même pour les valeurs suivies et les opérations d'une fiche). Sur grand écran, le formulaire reste visible pendant qu'on fait défiler la liste.
- Le crayon d'une ligne rouvre le formulaire prérempli pour corriger l'opération (une faute de saisie, ou des frais de courtage remboursés plus tard par le courtier : mets-les à 0 sur l'ordre concerné pour que le prix de revient soit juste). La correction est refusée si elle laissait une vente porter sur des titres non détenus.
- La corbeille supprime l'opération ; un achat dont dépend une vente ne se supprime qu'après elle.
- Les virements et les espèces du compte ne sont pas suivis.

### 2. Voir où en est son portefeuille — « Tableau de bord » (accueil)

- **Valorisation** au dernier cours, **plus-value latente** depuis les achats, **variation du jour**.
- **Investi, frais compris**, **plus-values réalisées** par les ventes et **dividendes perçus**.
- **Évolution du portefeuille** : valorisation face au montant investi, jour après jour depuis la première opération (1 mois à tout l'historique).
- **Positions** : une ligne par valeur détenue avec quantité, prix de revient unitaire (PRU), cours, plus-value, poids dans le portefeuille et tendance ; « Voir le détail » mène à la page Positions.
- **Marchés** : bandeau qui défile en boucle (il s'arrête au survol et se fait glisser à la main) avec Euronext Paris (où s'échangent les actions et ETF européens), Wall Street et les places asiatiques qui pèsent dans l'ETF Émergents (Shanghai, Hong Kong, Taïwan, Bombay, Séoul) : ouvertes, en pause de midi ou fermées, avec l'heure du prochain changement, jours fériés compris.
- **Actualités** : bandeau latéral avec les articles récents sur toutes les valeurs suivies.

### 3. Analyser ses lignes — page « Positions »

Toutes les lignes détenues, de façon technique mais lisible :

- **Synthèse** : valorisation, coût des titres détenus, plus-value latente et réalisée, dividendes perçus.
- **Poids dans le portefeuille** : où est l'argent, ligne par ligne, de la plus grosse à la plus petite.
- **Contribution à la plus-value** : d'où vient la plus-value latente, gains en vert à droite, pertes en rouge à gauche.
- **Acheter / Vendre** sur chaque ligne : ouvre la fiche de la valeur, sens déjà choisi dans l'encart d'ordre.
- **Détail des positions** : tableau triable (clic sur un en-tête) avec recherche et filtres (en gain, en perte, haussières, baissières) : PRU, cours et variation du jour, valorisation, poids, plus-value latente et réalisée, dividendes, tendance, performance sur 1 an, écart à la moyenne 200 séances, volatilité, écart au plus haut sur 52 semaines. Chaque notion technique a une bulle d'aide au survol de son en-tête ; les colonnes secondaires se masquent sur petit écran, et sur téléphone le tableau devient une liste (valorisation et plus-value, un appui ouvre la fiche).
- **Lignes soldées** : valeurs entièrement vendues, leur plus-value réalisée et leurs dividendes.
- **Comment lire cette page** : les notions expliquées en clair (PRU, latent ou réalisé, poids et contribution, moyennes mobiles, volatilité).

### 4. Comprendre une valeur et passer un ordre — fiche (clic sur son nom, ou depuis la recherche)

- **Passer un ordre** : encart Achat (vert) / Vente (rouge), date du jour, prix prérempli au dernier cours ; à droite sur grand écran, juste sous l'en-tête sur téléphone. La fiche se met à jour aussitôt (position, opérations).
- **Suivre** : bouton sous le cours si la valeur n'est pas encore suivie.
- **Cours** sur 1 mois à 5 ans, avec les **moyennes mobiles** sur 50 et 200 séances, ses **opérations** et son **PRU** sur la courbe.
- **Tendance**, expliquée en une phrase :
  - **haussière** : le cours et la moyenne sur 50 séances sont au-dessus de celle sur 200 ;
  - **baissière** : les deux sont en dessous ;
  - **neutre** : ils divergent, la tendance hésite ;
  - rien avant 200 séances d'historique.
- **Performances** sur 1, 3 et 6 mois, 1 an et depuis janvier.
- **Sur 52 semaines** : plus haut, plus bas, écart au plus haut et **volatilité** annualisée (au-delà de 30 %, le cours bouge fort).
- **Actualités** de la valeur, avec ses mots-clés modifiables.

### 5. Surveiller avant d'acheter — page « Suivi »

Les valeurs qu'on surveille, détenues ou non : cours et variation du jour, 1 mois, 1 an, écart au plus haut, tendance. Pour en ajouter une, la chercher (bouton « Rechercher une valeur » ou ⌘K) puis « Suivre » sur sa fiche ; une valeur achetée ou vendue y est ajoutée automatiquement. Sur chaque ligne : Acheter (vert) / Vendre (rouge), qui ouvrent la fiche avec le sens choisi, et « Ne plus suivre », qui ne touche pas aux opérations.

### 6. Suivre l'actualité qui compte

- Pour une **action** : l'actualité de l'entreprise.
- Pour un **ETF** : l'actualité de son marché plutôt que du fonds. Ce sont les résultats des entreprises de l'indice et les décisions des banques centrales qui font bouger le Nasdaq-100, pas les articles sur l'ETF Amundi.
- Mots-clés proposés selon la valeur, modifiables sur sa fiche (`OR` pour l'un ou l'autre, guillemets pour une expression exacte ; vide = revenir à la suggestion).
- Titres et liens vers les articles (Boursorama, Les Echos, Zonebourse…), en français, des 14 derniers jours.

### 7. Gérer son compte — page « Mon profil » (menu du compte, en haut à droite)

- **Informations** : prénom et nom (l'email sert d'identifiant et ne change pas).
- **Mot de passe** : le changer demande le mot de passe actuel et déconnecte les autres appareils.
- **Double authentification (2FA)**, recommandée : en plus du mot de passe, un code à 6 chiffres d'une application d'authentification (Google Authenticator, 1Password, Authy…).
  1. « Activer la double authentification » affiche un QR code (et la clé, à saisir à la main si besoin).
  2. Scanner, puis saisir le code affiché par l'application pour confirmer.
  3. Noter les 8 **codes de secours** (copier ou télécharger) : affichés une seule fois, chacun remplace le téléphone pour une connexion.
- **Connexion avec la 2FA** : après le mot de passe, une étape « Vérification » demande le code de l'application ou un code de secours ; elle expire au bout de 5 minutes ou 5 essais (retour au mot de passe).
- **Désactiver la 2FA** : mot de passe et code demandés.

### Bon à savoir

- **Cours différés** (environ 15 minutes), rafraîchis toutes les 10 minutes : pour suivre, pas pour passer un ordre à la seconde.
- **Prix de revient** au prix moyen pondéré, la méthode fiscale française (PEA et compte-titres) : une vente ne change pas le PRU, la différence avec le prix de vente est la plus-value réalisée.
- **Dividendes** comptés à part : ni dans le PRU, ni dans la plus-value réalisée, ni dans la courbe d'évolution (ce sont des espèces, qui ne sont pas suivies). Ils ne sont pas retrouvés automatiquement : à saisir depuis l'avis de versement.
- **Montants additionnés tels quels**, sans conversion de devise : prévu pour un portefeuille en euros (un PEA l'est toujours).
- **Horaires de marché** : Paris et New York calculés (fuseaux, heure d'été, jours fériés), sans les séances raccourcies des veilles de fêtes. Places asiatiques d'après la séance publiée par Yahoo : un jour férié (ex. Golden Week chinoise) s'affiche « jour férié · dernière séance le … » ; une fois la séance du jour finie, l'ouverture suivante est indiquée « normalement » tant que Yahoo ne l'a pas confirmée.
- **Sur téléphone et tablette** : les sections passent dans une barre d'onglets en bas de l'écran (Accueil, Positions, Opérations, Suivi), le compte reste en haut à droite ; les tableaux masquent leurs colonnes secondaires.
- **Rien n'est un conseil d'investissement** : tendances et actualités sont des informations.
- Appli personnelle : **pas d'inscription**, les comptes se créent en ligne de commande (voir plus bas).

---

## Technique

### Démarrer

Tout tourne dans Docker :

```sh
docker compose up -d --build
docker compose exec backend npm run user:create -- <email> <mot de passe> <prénom> <nom>
```

| Service | Adresse |
|---|---|
| Application | http://patrimo.localhost |
| API | http://api.patrimo.localhost (santé : `/health`) |
| Traefik | http://traefik.patrimo.localhost (prend le port 80 : arrêter footix avant) |
| Postgres | `localhost:5433` (patrimo / patrimo) |

Connexion : session par cookie, « Rester connecté » 30 jours, sinon 12 h et cookie effacé à la fermeture du navigateur ; 10 essais par email en 15 min. 2FA : TOTP standard (RFC 6238, 6 chiffres, 30 s) calculé dans `backend/src/auth/application/totp.ts`, clé en base, codes de secours hachés, vérification en attente gardée en mémoire 5 min (5 essais) ; QR code dessiné dans le navigateur (`uqr`).

### Architecture

Espace de travail npm, un seul lockfile, stack reprise de footix :

- `shared/` — schémas Zod partagés (la même règle valide le formulaire et l'API), types des réponses, calcul des horaires de marché.
- `backend/` — API Nest + Drizzle (Postgres), hexagonale : `src/<domaine>/{domain,application,infrastructure}/`.
  - `auth`, `users` : connexion (avec 2FA), sessions, profil, mot de passe, comptes.
  - `purchases` : opérations (achats, ventes et dividendes ; la table porte le nom d'avant les ventes).
  - `portfolio` : positions et lignes soldées, PRU, plus-values, tendance, historique, en fonctions pures.
  - `watchlist` : valeurs suivies, leurs mots-clés et le fil d'actualités.
  - `market` : recherche de valeurs, cours, dernier prix et séances des places asiatiques (port `MarketData`, adaptateur Yahoo Finance).
  - `news` : actualités (port `NewsFeed`, adaptateur Google Actualités).
- `frontend/` — Nuxt (SPA) + Nuxt UI, graphiques et logo en SVG maison (`components/brand/`), police Space Grotesk pour les titres.

### Sources de données

| Donnée | Source | Clé | Cache |
|---|---|---|---|
| Recherche par ISIN, cours sur 5 ans | Yahoo Finance (API publique non documentée) | Non | 10 min en mémoire |
| Actualités | Google Actualités (flux RSS public, édition française) | Non | 30 min en mémoire |
| Logos des éditeurs | Service de favicons de Google | Non | Navigateur |
| Horaires Paris et New York | Calcul local (`shared/src/markets/market-hours.ts`) | — | — |
| Séances des places asiatiques | Yahoo Finance, via l'indice de chaque place (`^HSI`, `000001.SS`…) | Non | Relues toutes les 10 min par l'accueil |

Chaque source est derrière un port : la remplacer ne touche qu'un adaptateur. Si les actualités sont en panne, la page s'affiche sans elles. Si les cours le sont, un message propose de réessayer.

### Développement

```sh
docker compose exec backend npm run test:cov       # unitaires, intégration et e2e + couverture (100 % exigé)
docker compose exec backend npm run lint
docker compose exec frontend npm run typecheck
docker compose exec backend npm run db:generate -- --name <nom>   # après un changement de table (migrations appliquées au démarrage)
```

Versions fixées partout (Node 26.10.0, Postgres 18.6, Traefik 3.7.13, dépendances npm exactes, actions GitHub figées sur leur commit) : une mise à jour est un changement volontaire, suivi de `docker compose up -d --build -V` et de toutes les vérifications ci-dessus. Dependabot propose les mises à jour chaque semaine, en une PR par écosystème (npm, images Docker, actions).

Règles de code, de tests et checklist avant commit : [`CLAUDE.md`](CLAUDE.md).

### Production

En ligne sur https://patrimo.natolive.fr, sur un serveur Docker personnel.

- **CI** (`.github/workflows/ci.yml`) : à chaque push et PR, lint, tests avec couverture sur une vraie base Postgres, typecheck du front et construction de l'image de prod. Une modification qui ne touche que la doc (`*.md`) ne la lance pas ; un nouveau push sur une PR annule l'exécution en cours.
- **Image** : sur `main`, publiée sur GHCR (`ghcr.io/natolive/patrimo:<sha du commit>`, onglet « Packages » du dépôt), les 10 dernières gardées. Elle ne contient que le front et le back compilés et les dépendances d'exécution du back ; les migrations y passent par `drizzle-orm` (`node dist/migrate.js`), `drizzle-kit` restant l'outil de dev. Après chaque déploiement, le serveur supprime ses anciennes images.
- **Déploiement** : push sur `main` avec tests et image au vert → GitHub se connecte au serveur avec une clé qui ne peut lancer que `/srv/patrimo/deploy.sh <sha>` (met le dépôt sur ce commit, tire l'image puis `docker compose -f compose.prod.yml up -d`). Les migrations s'appliquent au démarrage du back, puis la CI vérifie `https://patrimo.natolive.fr/api/health` depuis l'extérieur. Un commit avec `[skip ci]` ne déclenche rien. Revenir à une version : relancer le job « deploy » de son exécution dans l'onglet Actions, ou `/srv/patrimo/deploy.sh <sha>` sur le serveur.
- **Sur le serveur** : stack `compose.prod.yml` dans `/srv/patrimo/repo`, mot de passe Postgres et tag d'image déployé dans son `.env` (non versionné). HTTPS par Caddy (`/srv/caddy`, stack commune à tous les projets), qui joint le front sur le réseau Docker `proxy` ; l'API passe par le front (`/api`), la base et le back ne sont pas exposés.
- **Créer un compte** : `docker compose -f compose.prod.yml exec backend npm run user:create -- <email> <mot de passe> <prénom> <nom>` dans `/srv/patrimo/repo`.
