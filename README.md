# PEA

Front Nuxt UI, API Nest + Drizzle, Postgres. Tout tourne dans Docker.

```sh
docker compose up -d --build
```

- Front : http://pea.localhost
- API : http://api.pea.localhost/health
- Traefik : http://traefik.pea.localhost (prend le port 80 : arrêter footix avant)
- Postgres : `localhost:5433` (pea / pea)

## Comptes

Pas d'inscription : compte créé en ligne de commande,

```sh
docker compose exec backend npm run user:create -- <email> <mot de passe> <prénom> <nom>
```

puis connexion avec « Rester connecté » (30 jours, sinon 12 h et cookie effacé à la fermeture du navigateur), déconnexion. Toutes les pages sauf la connexion demandent d'être connecté. Connexion limitée à 10 essais par email en 15 min.

Tests : `docker compose exec backend npm run test:cov`.
