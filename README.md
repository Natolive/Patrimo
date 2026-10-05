# Patrimo

**Ton portefeuille, en clair.** Suivre son portefeuille d'actions et d'ETF (PEA, compte-titres…) au même endroit, quel que soit le courtier : ce qu'on a acheté et vendu, ce que ça vaut aujourd'hui, la tendance des valeurs détenues ou surveillées et l'actualité qui les fait bouger.

Les courtiers montrent les positions et les opérations, rarement l'évolution du portefeuille dans le temps, une lecture de tendance des valeurs ou l'actualité de leur marché. Patrimo les rassemble, à partir des avis d'opéré qu'on saisit soi-même.

---

## Ce que fait l'application

### 1. Saisir ses opérations — page « Opérations »

Pour chaque achat ou vente de son avis d'opéré (le document que le courtier envoie après chaque ordre exécuté) :

| Champ | Exemple | Remarque |
|---|---|---|
| Opération | Achat / Vente | |
| Valeur | `FR001400U5Q4` ou `DCAM` | Code ISIN de l'avis d'opéré (le plus sûr) ou mnémonique ; le nom retrouvé s'affiche dans la liste pour vérifier |
| Date | 01/10/2026 | |
| Quantité | 45 | Fractions acceptées |
| Prix unitaire | 6,259 | Jusqu'à 3 décimales, virgule ou point |
| Frais | 0 | Courtage ; le total de l'avis d'opéré moins quantité × prix |

- Une vente ne peut porter que sur des titres détenus à sa date.
- Sur grand écran, le formulaire reste visible pendant qu'on fait défiler la liste des opérations (de même pour « Suivre une valeur »).
- Pas de modification : supprimer l'opération puis la ressaisir. Un achat dont dépend une vente ne se supprime qu'après elle.
- Les virements et les espèces du compte ne sont pas suivis.

### 2. Voir où en est son portefeuille — « Tableau de bord » (accueil)

- **Valorisation** au dernier cours, **plus-value latente** depuis les achats, **variation du jour**.
- **Investi, frais compris** et **plus-values réalisées** par les ventes.
- **Évolution du portefeuille** : valorisation face au montant investi, jour après jour depuis la première opération (1 mois à tout l'historique).
- **Positions** : une ligne par valeur détenue avec quantité, prix de revient unitaire (PRU), cours, plus-value, poids dans le portefeuille et tendance.
- **Marchés** : bandeau qui défile en boucle (il s'arrête au survol et se fait glisser à la main) avec Euronext Paris (où s'échangent les actions et ETF européens), Wall Street et les places asiatiques qui pèsent dans l'ETF Émergents (Shanghai, Hong Kong, Taïwan, Bombay, Séoul) : ouvertes, en pause de midi ou fermées, avec l'heure du prochain changement, jours fériés compris.
- **Actualités** : bandeau latéral avec les articles récents sur toutes les valeurs suivies.

### 3. Comprendre une valeur — fiche (clic sur son nom)

- **Cours** sur 1 mois à 5 ans, avec les **moyennes mobiles** sur 50 et 200 séances, ses **opérations** et son **PRU** sur la courbe.
- **Tendance**, expliquée en une phrase :
  - **haussière** : le cours et la moyenne sur 50 séances sont au-dessus de celle sur 200 ;
  - **baissière** : les deux sont en dessous ;
  - **neutre** : ils divergent, la tendance hésite ;
  - rien avant 200 séances d'historique.
- **Performances** sur 1, 3 et 6 mois, 1 an et depuis janvier.
- **Sur 52 semaines** : plus haut, plus bas, écart au plus haut et **volatilité** annualisée (au-delà de 30 %, le cours bouge fort).
- **Actualités** de la valeur, avec ses mots-clés modifiables.

### 4. Surveiller avant d'acheter — page « Suivi »

Suivre une action ou un ETF par son code ISIN sans l'avoir acheté : cours, variations sur 1 mois et 1 an, écart au plus haut, tendance, et la même fiche qu'une valeur détenue, sans les montants. Une valeur achetée ou vendue y est ajoutée automatiquement ; « Ne plus suivre » la retire, sans toucher aux opérations.

### 5. Suivre l'actualité qui compte

- Pour une **action** : l'actualité de l'entreprise.
- Pour un **ETF** : l'actualité de son marché plutôt que du fonds. Ce sont les résultats des entreprises de l'indice et les décisions des banques centrales qui font bouger le Nasdaq-100, pas les articles sur l'ETF Amundi.
- Mots-clés proposés selon la valeur, modifiables sur sa fiche (`OR` pour l'un ou l'autre, guillemets pour une expression exacte ; vide = revenir à la suggestion).
- Titres et liens vers les articles (Boursorama, Les Echos, Zonebourse…), en français, des 14 derniers jours.

### Bon à savoir

- **Cours différés** (environ 15 minutes), rafraîchis toutes les 10 minutes : pour suivre, pas pour passer un ordre à la seconde.
- **Prix de revient** au prix moyen pondéré, la méthode fiscale française (PEA et compte-titres) : une vente ne change pas le PRU, la différence avec le prix de vente est la plus-value réalisée.
- **Montants additionnés tels quels**, sans conversion de devise : prévu pour un portefeuille en euros (un PEA l'est toujours).
- **Horaires de marché** : Paris et New York calculés (fuseaux, heure d'été, jours fériés), sans les séances raccourcies des veilles de fêtes. Places asiatiques d'après la séance publiée par Yahoo : un jour férié (ex. Golden Week chinoise) s'affiche « jour férié · dernière séance le … » ; une fois la séance du jour finie, l'ouverture suivante est indiquée « normalement » tant que Yahoo ne l'a pas confirmée.
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

Connexion : session par cookie, « Rester connecté » 30 jours, sinon 12 h et cookie effacé à la fermeture du navigateur ; 10 essais par email en 15 min.

### Architecture

Espace de travail npm, un seul lockfile, stack reprise de footix :

- `shared/` — schémas Zod partagés (la même règle valide le formulaire et l'API), types des réponses, calcul des horaires de marché.
- `backend/` — API Nest + Drizzle (Postgres), hexagonale : `src/<domaine>/{domain,application,infrastructure}/`.
  - `auth`, `users` : connexion, sessions, comptes.
  - `purchases` : opérations (achats et ventes ; la table porte le nom d'avant les ventes).
  - `portfolio` : positions, PRU, plus-values, tendance, historique, en fonctions pures.
  - `watchlist` : valeurs suivies, leurs mots-clés et le fil d'actualités.
  - `market` : cours et séances des places asiatiques (port `MarketData`, adaptateur Yahoo Finance).
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

Règles de code, de tests et checklist avant commit : [`CLAUDE.md`](CLAUDE.md).
