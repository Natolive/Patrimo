import type { AssetSuggestion } from '@src/market/domain/asset-suggestion.entity.js';
import type { Instrument } from '@src/market/domain/instrument.entity.js';
import { MarketData } from '@src/market/domain/market-data.js';
import type { PricePoint } from '@src/market/domain/price-point.entity.js';
import type { TradingSession } from '@src/market/domain/trading-session.entity.js';

// Cours fixés par le test : `instruments` retrouvés par ISIN ou symbole, `histories` et `sessions` par symbole (séance absente = place injoignable).
export class FakeMarketData extends MarketData {
  instruments: (Instrument & { isin: string })[] = [{ symbol: 'AI.PA', isin: 'FR0000120073', name: "L'Air Liquide S.A.", currency: 'EUR' }];
  histories = new Map<string, PricePoint[]>([
    [
      'AI.PA',
      [
        { date: '2026-01-02', close: 100 },
        { date: '2026-01-05', close: 110 },
        { date: '2026-01-06', close: 120 },
      ],
    ],
  ]);

  async search(query: string) {
    const found = this.instruments.find((i) => i.isin === query || i.symbol === query);
    return found ? { symbol: found.symbol, name: found.name, currency: found.currency } : null;
  }

  sessions = new Map<string, TradingSession>([['^HSI', { start: new Date('2026-10-06T01:30:00Z'), end: new Date('2026-10-06T08:10:00Z'), lastSession: '2026-10-05' }]]);

  async session(symbol: string) {
    const session = this.sessions.get(symbol);
    if (!session) throw new Error(`Pas de séance pour ${symbol}`);
    return session;
  }

  // Toutes les valeurs dont le nom, le symbole ou l'ISIN contient la recherche (sans casse).
  async suggest(query: string): Promise<AssetSuggestion[]> {
    const q = query.toLowerCase();
    return this.instruments
      .filter((i) => `${i.name} ${i.symbol} ${i.isin}`.toLowerCase().includes(q))
      .map((i) => ({ symbol: i.symbol, name: i.name, exchange: 'Paris', type: 'equity' }));
  }

  async history(symbol: string) {
    return this.histories.get(symbol) ?? [];
  }
}
