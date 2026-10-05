import type { Instrument } from '@src/market/domain/instrument.entity.js';
import { MarketData } from '@src/market/domain/market-data.js';
import type { PricePoint } from '@src/market/domain/price-point.entity.js';

// Cours fixés par le test : `instruments` retrouvés par ISIN ou symbole, `histories` par symbole.
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

  async history(symbol: string) {
    return this.histories.get(symbol) ?? [];
  }
}
