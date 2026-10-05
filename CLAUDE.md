# PEA — règles projet

Stack et conventions reprises de `../footix` (son `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md` font foi).

- Tout passe par Docker (`docker compose exec <backend|frontend> ...`), jamais `npm` sur l'hôte (Node trop ancien).
- Workspace npm : `shared/` (DTO Zod), `backend/` (Nest + Drizzle, hexagonal), `frontend/` (Nuxt UI), un seul lockfile à la racine.
- Un DTO = `shared/src/<domaine>/<nom>.dto.ts`, réexporté dans `shared/src/index.ts` (imports relatifs en `.ts`).
- Back : `src/<domaine>/{domain,application,infrastructure}/`, un service par route ; erreur métier = sous-classe de `common/domain/errors/`.
- Repository = port qui étend `BaseRepository` + adaptateur qui étend `DrizzleRepository` ; entité absente = `orThrow(...)` ; body validé par `ZodValidationPipe`.
- Route protégée = `@Authorize()` (guard global `SessionGuard`, 401 sans session), `@CurrentUser()` donne la personne connectée ; sans décorateur, la route est publique.
- Route publique qui teste un mot de passe = `@RateLimit(...)`.
- Front : pages privées par défaut (`auth.global.ts`), `definePageMeta({ guest: true })` pour les visiteurs ; formulaire = `FormBuilder` + schéma `@pea/shared` ; compte via `useAuth()`.
- Table Drizzle dans `<domaine>/infrastructure/*.table.ts`, exportée dans `common/infrastructure/database/schema.ts`, puis `docker compose exec backend npm run db:generate -- --name <nom>`.
- Tests dans `backend/test/`, `npm run test:cov` à 100 %.
- Code en anglais, commentaires et textes d'interface en français. Raccourci assumé = commentaire `ponytail:`.
