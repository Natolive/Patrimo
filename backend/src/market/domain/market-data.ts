import type { CandleRange } from '@patrimo/shared';
import type { AssetSuggestion } from './asset-suggestion.entity.js';
import type { CandleSeries } from './candle.entity.js';
import type { Instrument } from './instrument.entity.js';
import type { PricePoint } from './price-point.entity.js';
import type { TradingSession } from './trading-session.entity.js';

export abstract class MarketData {
  // Valeur correspondant à un code ISIN, un mnémonique ou un nom ; null si rien ne correspond.
  abstract search(query: string): Promise<Instrument | null>;
  // Actions et ETF qui correspondent, pour la recherche globale (quelques-uns, les plus pertinents d'abord).
  abstract suggest(query: string): Promise<AssetSuggestion[]>;
  // Clôtures quotidiennes sur 5 ans, de la plus ancienne à la plus récente (la dernière = cours du jour, celui du flux direct si la valeur est écoutée).
  abstract history(symbol: string): Promise<PricePoint[]>;
  // Bougies (ouverture, plus haut, plus bas, clôture, volume) de la période, de la plus ancienne à la plus récente.
  abstract candles(symbol: string, range: CandleRange): Promise<CandleSeries>;
  // Séance de la place d'un indice (ex. `^HSI` pour Hong Kong), jours fériés compris.
  abstract session(symbol: string): Promise<TradingSession>;
}
