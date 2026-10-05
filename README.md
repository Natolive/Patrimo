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

## Opérations

Page « Opérations » : un achat ou une vente = valeur (code ISIN de l'avis d'opéré Bourse Direct, ou mnémonique), date, quantité (fractions acceptées), prix unitaire (jusqu'à 3 décimales, comme sur l'avis d'opéré) et frais, avec virgule ou point. La valeur est retrouvée chez Yahoo Finance (cotation à Paris en priorité) ; son nom s'affiche dans la liste pour vérifier. Pas de modification : supprimer puis ressaisir. Toute opération ajoute la valeur à la liste de suivi.

- Prix de revient unitaire (PRU) au prix moyen pondéré, frais d'achat compris : une vente ne le change pas, elle sort sa part du coût et la différence (frais de vente déduits) est la plus-value réalisée.
- Une vente ne peut porter que sur des titres détenus à sa date (achats avant ventes le même jour) ; un achat dont dépend une vente ne se supprime qu'après elle.
- Ligne entièrement vendue : retirée des positions, sa plus-value réalisée reste dans le total.
- Virements et espèces non suivis.

## Tableau de bord

- Valorisation, plus-value latente et variation du jour, frais compris dans le montant investi.
- Courbe de la valorisation face au montant investi depuis le premier achat (1 mois à tout l'historique, 5 ans au plus).
- Une ligne par valeur : quantité, prix de revient unitaire (frais compris), cours, plus-value, poids, tendance.
- Fiche d'une valeur (clic sur son nom) : cours avec moyennes mobiles 50 et 200 séances, achats et PRU sur la courbe, performances (1, 3, 6 mois, 1 an, depuis janvier), plus haut et plus bas sur 52 semaines, volatilité annualisée.
- Tendance haussière : cours et MM50 au-dessus de la MM200 ; baissière : les deux en dessous ; neutre sinon ; rien sous 200 séances d'historique.

## Suivi

Page « Suivi » : suivre une action ou un ETF par son code ISIN sans l'avoir acheté (cours, variations, tendance) ; sa fiche est la même qu'une valeur détenue, sans les montants.

## Cours

Yahoo Finance, gratuit et sans clé (API publique non documentée), cours différés gardés 10 minutes en mémoire. Montants additionnés sans conversion de devise (PEA : valeurs en euros). Fournisseur remplaçable derrière `MarketData` (`backend/src/market/`).

Tests : `docker compose exec backend npm run test:cov`.
