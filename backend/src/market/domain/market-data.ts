import type { Instrument } from './instrument.entity.js';
import type { PricePoint } from './price-point.entity.js';

export abstract class MarketData {
  // Valeur correspondant à un code ISIN, un mnémonique ou un nom ; null si rien ne correspond.
  abstract search(query: string): Promise<Instrument | null>;
  // Clôtures quotidiennes sur 5 ans, de la plus ancienne à la plus récente (la dernière = cours du jour).
  abstract history(symbol: string): Promise<PricePoint[]>;
}
