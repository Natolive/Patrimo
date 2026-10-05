# Patrimo — règles projet

Patrimo : appli de suivi d'un portefeuille d'actions et d'ETF (PEA, compte-titres…), quel que soit le courtier : opérations, positions, tendances, actualités. Stack et conventions inspirées de `../footix`, mais seules les règles ci-dessous s'appliquent ici (pas d'inscription, d'emails, de rôles ni de visite guidée).

## Général

- Tout passe par Docker (`docker compose exec <backend|frontend> ...`), jamais `npm` sur l'hôte (Node trop ancien).
- Versions toutes fixées : dépendances npm exactes (`.npmrc` `save-exact=true`, jamais de `^` ni `~`), images Docker à l'étiquette exacte (`Dockerfile`, `docker-compose.yml`), jamais `latest`. Mise à jour = volontaire : changer la version, régénérer le lockfile, `docker compose up -d --build -V`, puis tests, lint, typecheck, builds et navigateur.
- TypeScript reste en 6.x tant que la 7 n'a pas d'API de compilation (attendue en 7.1) : Nest CLI et `vue-tsc` en ont besoin.
- Workspace npm : `shared/` (DTO Zod et code commun), `backend/` (Nest + Drizzle, hexagonal), `frontend/` (Nuxt UI), un seul lockfile à la racine.
- Un DTO = `shared/src/<domaine>/<nom>.dto.ts`, réexporté dans `shared/src/index.ts` ; dans `shared/` : imports relatifs en `.ts`, pas d'`enum`/`namespace` (chargé sans compilation).
- La validation vit uniquement dans le schéma partagé, messages en français qui disent comment corriger.
- Code en anglais, commentaires et textes d'interface en français (tutoiement).
- Pas d'abstraction « pour plus tard » ; raccourci assumé = commentaire `ponytail:`.

## Back

- `src/<domaine>/{domain,application,infrastructure}/` + `<domaine>.module.ts`, transverse dans `src/common/`.
- Un service par route (`application/<action>.service.ts`, une méthode `execute`) ; erreur métier = `domain/errors/<nom>.error.ts`, sous-classe d'une erreur de `common/domain/errors/`, jamais d'exception HTTP.
- Repository = port qui étend `BaseRepository` + adaptateur qui étend `DrizzleRepository`, liés dans le module ; entité absente = `orThrow(...)` ; body validé par `ZodValidationPipe` avec un schéma `@patrimo/shared`.
- Ressource d'une personne (opération, valeur suivie) : celle d'un autre compte répond comme inexistante (404).
- Table Drizzle dans `<domaine>/infrastructure/*.table.ts`, exportée dans `common/infrastructure/database/schema.ts`, puis `docker compose exec backend npm run db:generate -- --name <nom>` (migrations appliquées au démarrage).
- Imports relatifs en `.js` (ESM).
- Pas d'inscription (voulu) : comptes créés par `npm run user:create` (`backend/src/create-user.ts`).
- Route protégée = `@Authorize()` (guard global `SessionGuard`, 401 sans session), `@CurrentUser()` donne la personne connectée ; sans décorateur, la route est publique. Route qui teste un mot de passe ou un code 2FA = `@RateLimit(...)`.
- 2FA : codes TOTP uniquement via `totp.ts` (RFC 6238, testé sur ses vecteurs) et `checkSecondFactor` (code de l'application ou de secours, ce dernier consommé) ; codes de secours toujours hachés (`hashToken`) ; connexion en deux temps via `TwoFactorChallenges` (`POST /auth/login` renvoie `{ user }` ou `{ challenge }`). Action sensible sur le compte (désactiver la 2FA, changer de mot de passe) = mot de passe actuel redemandé.
- Cours : uniquement via le port `MarketData` (adaptateur Yahoo), jamais d'appel HTTP ailleurs.
- Actualités : uniquement via le port `NewsFeed` (adaptateur Google Actualités), titres et liens seulement ; mots-clés par défaut dans `suggestNewsQuery`.
- Opérations = table `purchases` avec `side` (`buy`/`sell`) : le nom date d'avant les ventes, ne pas en déduire « achat seulement ». Quantités et PRU uniquement via `applyTrade`/`chronological` (`portfolio/domain/holding.ts`) ; toute opération ajoute la valeur à la liste de suivi.
- Calculs du portefeuille (positions, tendance, historique) en fonctions pures dans `portfolio/domain/`.

## Tests (`backend/test/`)

- Jamais de `*.spec.ts` à côté du code ; imports via les alias `@src/*` et `@test/*`.
- `test/unit/` reproduit l'arborescence de `src/` : service instancié à la main avec les fakes de `test/fakes/` (`InMemoryXxxRepository`, `FakeMarketData`, `FakeNewsFeed`, `FakePasswordHasher`), jamais de mocks ni de `Test.createTestingModule` ; adaptateur HTTP (Yahoo, Google) testé avec `fetch` remplacé (`vi.stubGlobal`).
- Code de `shared/` avec de la logique (horaires des marchés) : testé dans `test/unit/shared/`.
- `test/integration/` : adaptateurs Drizzle sur la vraie base ; `test/e2e/` : parcours HTTP complet (supertest), `MarketData` et `NewsFeed` remplacés par leurs fakes (`overrideProvider`) ; données créées avec un email unique et supprimées en `afterAll`.
- Nouveau repository = son `InMemoryXxxRepository` ; nouveau code = son test dans la couche qui convient, jamais une exclusion de couverture.

## Front

- Composant Nuxt UI (`U*`) d'abord, icônes `i-lucide-*` ; composants rangés par dossier, fichier préfixé par le dossier (`news/NewsList.vue`).
- Thème clair uniquement (`ui.colorMode: false`), responsive ; libellés Nuxt UI en français (`<UApp :locale="fr">`).
- Pages privées par défaut (`auth.global.ts`), `definePageMeta({ guest: true })` pour les visiteurs ; compte via `useAuth()`, appels API via `useApi()`, erreur affichée avec `apiErrorMessage(e)` dans un toast.
- Formulaire = `FormBuilder` + schéma `@patrimo/shared`, jamais de `validate` à la main.
- Liste qui peut grandir = route paginée (`pageQuerySchema` → `PageDto<T>` `{ items, total }`, 20 par défaut) + `usePaginatedList` côté front, avec `ListSkeleton` pendant le chargement et `ListSentinel` sous la liste pour charger la suite au défilement ; `reset()` après un ajout ou une suppression. Pas pour les positions (totaux calculés sur toutes) ni les actualités (20 au plus).
- Action qui retire quelque chose (suppression, arrêt du suivi) = `UModal` de confirmation qui dit ce qui part.
- Montants via `utils/format.ts` (`money`, `unitMoney` jusqu'à 3 décimales pour un prix de titre, `percent`…), gain/perte toujours signé et coloré par `gainClass`.
- Marque : nom « Patrimo » ; symbole = deux barres montantes puis un « P » plein (troisième barre), angles vifs sur tuile sombre `#062019`, émeraudes `#047857` / `#10b981` / `#6ee7b7` ; logo = `BrandLogo` (symbole + nom) ou `BrandMark` (symbole seul), favicon `public/favicon.svg` à garder identique, `play` pour l'animer à l'affichage (connexion seulement), sinon il s'anime au survol du lien qui le contient ; titres de page en Space Grotesk (`font-display`), nom écrit « patrimo » en minuscules dans le logo, couleur primaire `emerald` ; nom de l'appli dans les titres d'onglet via `titleTemplate` (`nuxt.config.ts`), une page ne donne que son titre ; aucun courtier nommé dans l'interface ni la doc.
- Graphique = `ChartLine` (courbes : SVG maison, réticule + infobulle) ou `ChartBars` (barres horizontales classées, `diverging` pour un gain/perte signé en vert/rouge), couleurs `--color-chart-1..3` de `main.css` dans cet ordre ; notion technique dans un en-tête de tableau = bulle d'aide (`UTooltip`).
- Animation uniquement en réponse à une action (navigation, ajout, changement de période) ; seule exception, demandée : le bandeau des marchés de l'accueil qui défile en boucle (`UCarousel` + `autoScroll`, arrêt au survol, immobile sous `prefers-reduced-motion`) ; classes de `main.css` (`page-*`, `flash`, `cascade`) ou `<style scoped>` en fin de fichier, toujours coupée sous `prefers-reduced-motion` ; page à racine unique (transition de page).

## Documentation

`README.md` en deux parties, dans cet ordre :

1. **Pour l'utilisateur** (sans jargon de code) : objectif de l'appli, puis « Ce que fait l'application », une section par page ou usage (Opérations, Tableau de bord, fiche d'une valeur, Suivi, Actualités…), puis « Bon à savoir » (limites, méthodes de calcul en clair).
2. **Technique** : démarrer, architecture (un point par domaine du back), sources de données (tableau), développement.

À mettre à jour dans la même modification que le code :

| Changement | Où |
|---|---|
| Nouvelle page, nouveau champ, nouvelle action à l'écran | README partie 1, section de la page (créer la section si nouvelle page) |
| Règle de calcul ou limite visible (PRU, tendance, horaires…) | README partie 1, section concernée ou « Bon à savoir » |
| Nouveau domaine back, nouvelle source de données, nouveau service Docker | README partie 2 (architecture, tableau des sources, adresses) |
| Nouvelle commande de dev | README partie 2, « Développement » |
| Nouvelle convention de code, de test ou de front | Ce fichier, section concernée |
| Fonction retirée ou renommée | Supprimer ou renommer partout (README, ce fichier), jamais laisser un ancien libellé |

## Avant de dire « fini » ou de commit

- Documentation à jour selon le tableau ci-dessus (un hook le rappelle avant chaque commit et en fin de réponse s'il reste des changements).
- `docker compose exec backend npm run test:cov` vert (tests + couverture 100 % des lignes) et `npm run lint` sans erreur.
- Front modifié = `docker compose exec frontend npm run typecheck` sans erreur, puis vérifié dans le navigateur (le typecheck ne voit pas une erreur de template).
- Commit en français, une ligne qui dit ce qui change pour l'utilisateur ; dépôt privé `Natolive/Patrimo`, pas de CI ni de prod.
