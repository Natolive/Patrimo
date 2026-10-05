import { AssetNotFoundError } from '@src/market/domain/errors/asset-not-found.error.js';
import { lea, purchase, setupPurchases } from './setup.js';

describe('CreatePurchaseService', () => {
  it('finds the asset from its ISIN and saves the purchase with its total', async () => {
    const app = setupPurchases();
    expect(await app.create.execute(lea, purchase)).toEqual({
      id: '1',
      symbol: 'AI.PA',
      name: "L'Air Liquide S.A.",
      currency: 'EUR',
      boughtAt: '2026-01-02',
      quantity: 10,
      unitPrice: 100,
      fees: 2,
      total: 1002,
    });
    expect(app.purchases.rows[0].userId).toBe('lea');
  });

  it('refuses an asset the market does not know', async () => {
    const app = setupPurchases();
    await expect(app.create.execute(lea, { ...purchase, asset: 'NOPE' })).rejects.toBeInstanceOf(AssetNotFoundError);
    expect(app.purchases.rows).toHaveLength(0);
  });
});
