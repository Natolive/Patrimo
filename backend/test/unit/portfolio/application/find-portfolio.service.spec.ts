import { FindAssetService } from '@src/portfolio/application/find-asset.service.js';
import { FindPortfolioService } from '@src/portfolio/application/find-portfolio.service.js';
import { AssetNotTrackedError } from '@src/portfolio/domain/errors/asset-not-tracked.error.js';
import { CreateWatchService } from '@src/watchlist/application/create-watch.service.js';
import { lea, max, purchase, setupPurchases } from '../../purchases/application/setup.js';

function setup() {
  const app = setupPurchases();
  app.market.instruments.push({ symbol: 'CW8.PA', isin: 'LU1681043599', name: 'Amundi MSCI World', currency: 'EUR' });
  app.market.histories.set('CW8.PA', [
    { date: '2026-01-05', close: 500 },
    { date: '2026-01-06', close: 400 },
  ]);
  const portfolio = new FindPortfolioService(app.purchases, app.market);
  return {
    ...app,
    portfolio,
    watch: new CreateWatchService(app.watches, app.market),
    asset: new FindAssetService(portfolio, app.purchases, app.watches, app.market),
  };
}

describe('FindPortfolioService', () => {
  it('sums my positions, largest first, with their weight and history', async () => {
    const app = setup();
    await app.create.execute(lea, purchase);
    await app.create.execute(lea, { ...purchase, asset: 'CW8.PA', boughtAt: '2026-01-05', quantity: 1, unitPrice: 500, fees: 0 });
    await app.create.execute(max, purchase);

    const portfolio = await app.portfolio.execute(lea);
    expect(portfolio).toMatchObject({ invested: 1502, value: 1600, gain: 98, dayChange: 0, realizedGain: 0 });
    expect(portfolio.gainRate).toBeCloseTo(98 / 1502);
    expect(portfolio.positions.map((p) => [p.symbol, p.weight])).toEqual([
      ['AI.PA', 0.75],
      ['CW8.PA', 0.25],
    ]);
    expect(portfolio.history.at(-1)).toEqual({ date: '2026-01-06', value: 1600, invested: 1502 });
  });

  it('leaves closed lines out of the positions but keeps their realized gain', async () => {
    const app = setup();
    await app.create.execute(lea, purchase);
    await app.create.execute(lea, { ...purchase, side: 'sell', boughtAt: '2026-01-06', unitPrice: 120, fees: 0 });
    const portfolio = await app.portfolio.execute(lea);
    expect(portfolio).toMatchObject({ value: 0, invested: 0, realizedGain: 198, positions: [] });
    // Toujours suivie : sa fiche reste ouverte, sans position.
    expect(await app.asset.execute(lea, 'AI.PA')).toMatchObject({ position: null, purchases: [{ side: 'sell' }, { side: 'buy' }] });
  });

  it('is empty without purchases', async () => {
    expect(await setup().portfolio.execute(lea)).toEqual({
      invested: 0, value: 0, gain: 0, gainRate: 0, realizedGain: 0, dayChange: 0, dayChangeRate: 0, positions: [], history: [],
    });
  });
});

describe('FindAssetService', () => {
  it('gives the position, the closes with their averages and my purchases of it', async () => {
    const app = setup();
    await app.create.execute(lea, purchase);
    await app.create.execute(lea, { ...purchase, asset: 'CW8.PA' });
    const asset = await app.asset.execute(lea, 'AI.PA');
    expect(asset).toMatchObject({ symbol: 'AI.PA', name: "L'Air Liquide S.A.", price: 120, watchId: '1' });
    expect(asset.position).toMatchObject({ symbol: 'AI.PA', quantity: 10 });
    expect(asset.points[0]).toEqual({ date: '2026-01-02', close: 100, sma50: null, sma200: null });
    expect(asset.purchases.map((p) => p.symbol)).toEqual(['AI.PA']);
  });

  it('gives a value I only follow, without position nor purchases', async () => {
    const app = setup();
    const { id } = await app.watch.execute(lea, { asset: 'CW8.PA' });
    const asset = await app.asset.execute(lea, 'CW8.PA');
    expect(asset).toMatchObject({ name: 'Amundi MSCI World', price: 400, position: null, watchId: id, purchases: [] });
    expect(asset.trend.performance['1m']).toBeNull();
  });

  it('refuses a value I neither hold nor follow', async () => {
    const app = setup();
    await app.create.execute(max, purchase);
    await expect(app.asset.execute(lea, 'AI.PA')).rejects.toBeInstanceOf(AssetNotTrackedError);
  });
});
