# PEA — règles projet

Stack et conventions reprises de `../footix` (son `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md` font foi).

- Tout passe par Docker (`docker compose exec <backend|frontend> ...`), jamais `npm` sur l'hôte (Node trop ancien).
- Workspace npm : `shared/` (DTO Zod), `backend/` (Nest + Drizzle, hexagonal), `frontend/` (Nuxt UI), un seul lockfile à la racine.
- Un DTO = `shared/src/<domaine>/<nom>.dto.ts`, réexporté dans `shared/src/index.ts` (imports relatifs en `.ts`).
- Back : `src/<domaine>/{domain,application,infrastructure}/`, un service par route ; erreur métier = sous-classe de `common/domain/errors/`.
- Repository = port qui étend `BaseRepository` + adaptateur qui étend `DrizzleRepository` ; entité absente = `orThrow(...)` ; body validé par `ZodValidationPipe`.
- Pas d'inscription (voulu) : comptes créés par `npm run user:create` (`backend/src/create-user.ts`).
- Route protégée = `@Authorize()` (guard global `SessionGuard`, 401 sans session), `@CurrentUser()` donne la personne connectée ; sans décorateur, la route est publique.
- Route publique qui teste un mot de passe = `@RateLimit(...)`.
- Front : pages privées par défaut (`auth.global.ts`), `definePageMeta({ guest: true })` pour les visiteurs ; formulaire = `FormBuilder` + schéma `@pea/shared` ; compte via `useAuth()`.
- Table Drizzle dans `<domaine>/infrastructure/*.table.ts`, exportée dans `common/infrastructure/database/schema.ts`, puis `docker compose exec backend npm run db:generate -- --name <nom>`.
- Cours : uniquement via le port `MarketData` (adaptateur Yahoo), jamais d'appel HTTP ailleurs ; tests avec `FakeMarketData` (aussi en e2e via `overrideProvider`).
- Opérations = table `purchases` avec `side` (`buy`/`sell`) : le nom date d'avant les ventes, ne pas en déduire « achat seulement ». Quantités et PRU uniquement via `applyTrade`/`chronological` (`portfolio/domain/holding.ts`).
- Actualités : uniquement via le port `NewsFeed` (adaptateur Google Actualités), titres et liens seulement ; mots-clés par défaut dans `suggestNewsQuery`, tests avec `FakeNewsFeed`.
- Calculs du portefeuille (positions, tendance, historique) en fonctions pures dans `portfolio/domain/`, testées sans fakes.
- Animation uniquement en réponse à une action (navigation, ajout, changement de période), classes de `main.css` (`page-*`, `flash`, `cascade`) ou `<style scoped>`, toujours coupée sous `prefers-reduced-motion` ; page à racine unique (transition de page).
- Graphique = `ChartLine` (SVG maison, réticule + infobulle), couleurs `--color-chart-1..3` de `main.css` dans cet ordre ; montants via `utils/format.ts`, gain/perte toujours signé.
- Tests dans `backend/test/`, `npm run test:cov` à 100 %.
- Code en anglais, commentaires et textes d'interface en français. Raccourci assumé = commentaire `ponytail:`.
