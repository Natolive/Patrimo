# PEA

Front Nuxt UI, API Nest + Drizzle, Postgres. Tout tourne dans Docker.

```sh
docker compose up -d --build
```

- Front : http://localhost:3010
- API : http://localhost:3011/health
- Postgres : `localhost:5433` (pea / pea)

## Comptes

Inscription (nom, prénom, email, mot de passe de 8 caractères minimum) qui connecte directement, connexion avec « Rester connecté » (30 jours, sinon 12 h et cookie effacé à la fermeture du navigateur), déconnexion. Toutes les pages sauf connexion et inscription demandent d'être connecté. Connexion limitée à 10 essais par email en 15 min.

Tests : `docker compose exec backend npm run test:cov`.
