# PEA — règles projet

Stack et conventions reprises de `../footix` (son `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md` font foi).

- Tout passe par Docker (`docker compose exec <backend|frontend> ...`), jamais `npm` sur l'hôte (Node trop ancien).
- Workspace npm : `shared/` (DTO Zod), `backend/` (Nest + Drizzle, hexagonal), `frontend/` (Nuxt UI), un seul lockfile à la racine.
- Un DTO = `shared/src/<domaine>/<nom>.dto.ts`, réexporté dans `shared/src/index.ts` (imports relatifs en `.ts`).
- Back : `src/<domaine>/{domain,application,infrastructure}/`, un service par route ; erreur métier = sous-classe de `common/domain/errors/`.
- Premier repository : reprendre `BaseRepository`, `DrizzleRepository`, `orThrow` et `ZodValidationPipe` de footix.
- Table Drizzle dans `<domaine>/infrastructure/*.table.ts`, exportée dans `common/infrastructure/database/schema.ts`, puis `docker compose exec backend npm run db:generate -- --name <nom>`.
- Tests dans `backend/test/`, `npm run test:cov` à 100 %.
- Code en anglais, commentaires et textes d'interface en français. Raccourci assumé = commentaire `ponytail:`.
