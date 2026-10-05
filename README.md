# PEA

Front Nuxt UI, API Nest + Drizzle, Postgres. Tout tourne dans Docker.

```sh
docker compose up -d --build
```

- Front : http://localhost:3010
- API : http://localhost:3011/health
- Postgres : `localhost:5433` (pea / pea)

Tests : `docker compose exec backend npm run test:cov`.
