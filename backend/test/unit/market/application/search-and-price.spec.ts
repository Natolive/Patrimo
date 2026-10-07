import { FindCandlesService } from '@src/market/application/find-candles.service.js';
import { FindLastPriceService } from '@src/market/application/find-last-price.service.js';
import { SearchAssetsService } from '@src/market/application/search-assets.service.js';
import { MarketUnavailableError } from '@src/market/domain/errors/market-unavailable.error.js';
import { FakeMarketData } from '@test/fakes/fake-market-data.js';

describe('SearchAssetsService', () => {
  it('suggests the values matching a name, a symbol or an ISIN', async () => {
    const search = new SearchAssetsService(new FakeMarketData());
    expect(await search.execute({ q: 'liquide' })).toEqual([{ symbol: 'AI.PA', name: "L'Air Liquide S.A.", exchange: 'Paris', type: 'equity' }]);
    expect(await search.execute({ q: 'FR0000120073' })).toHaveLength(1);
    expect(await search.execute({ q: 'nope' })).toEqual([]);
  });
});

describe('FindLastPriceService', () => {
  it('gives the last close of a value', async () => {
    expect(await new FindLastPriceService(new FakeMarketData()).execute('AI.PA')).toEqual({ symbol: 'AI.PA', price: 120, date: '2026-01-06' });
  });

  it('reports the market as unavailable without any close', async () => {
    await expect(new FindLastPriceService(new FakeMarketData()).execute('NOPE')).rejects.toBeInstanceOf(MarketUnavailableError);
  });
});

describe('FindCandlesService', () => {
  it('gives the candles of a value for the period', async () => {
    const { offset, candles } = await new FindCandlesService(new FakeMarketData()).execute('AI.PA', { range: '5y' });
    expect(offset).toBe(0);
    expect(candles.at(-1)).toEqual({ time: Date.parse('2026-01-06') / 1000, open: 120, high: 120, low: 120, close: 120, volume: 0 });
  });
});
