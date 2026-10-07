import type { PriceTick } from './price-tick.entity.js';

export abstract class PriceStream {
  // Écoute les cotations d'une valeur ; renvoie la fonction qui arrête l'écoute.
  abstract subscribe(symbol: string, listener: (tick: PriceTick) => void): () => void;
  // Dernière cotation reçue d'une valeur écoutée (cours du jour plus frais que l'historique).
  abstract last(symbol: string): PriceTick | undefined;
}
