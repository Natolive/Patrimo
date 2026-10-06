import { AssetNotFoundError } from '@src/market/domain/errors/asset-not-found.error.js';
import { OversoldError } from '@src/purchases/domain/errors/oversold.error.js';
import { PurchaseNotFoundError } from '@src/purchases/domain/errors/purchase-not-found.error.js';
import { lea, max, purchase, setupPurchases } from './setup.js';

describe('UpdatePurchaseService', () => {
  it('corrects my purchase, its total follows', async () => {
    const app = setupPurchases();
    const { id } = await app.create.execute(lea, purchase);
    expect(await app.update.execute(lea, id, { ...purchase, fees: 0 })).toMatchObject({ id, symbol: 'AI.PA', fees: 0, total: 1000 });
    expect(app.purchases.rows[0]).toMatchObject({ userId: 'lea', fees: 0 });
  });

  it("answers not found for someone else's purchase or an unknown one", async () => {
    const app = setupPurchases();
    const { id } = await app.create.execute(lea, purchase);
    await expect(app.update.execute(max, id, { ...purchase, fees: 0 })).rejects.toBeInstanceOf(PurchaseNotFoundError);
    await expect(app.update.execute(lea, 'unknown', purchase)).rejects.toBeInstanceOf(PurchaseNotFoundError);
    expect(app.purchases.rows[0].fees).toBe(2);
  });

  it('refuses a correction that would leave a sale uncovered or an unknown asset', async () => {
    const app = setupPurchases();
    const bought = await app.create.execute(lea, purchase);
    const sale = { ...purchase, side: 'sell' as const, boughtAt: '2026-01-05', quantity: 4 };
    const sold = await app.create.execute(lea, sale);
    await expect(app.update.execute(lea, bought.id, { ...purchase, quantity: 3 })).rejects.toBeInstanceOf(OversoldError);
    await expect(app.update.execute(lea, sold.id, { ...sale, boughtAt: '2026-01-01' })).rejects.toBeInstanceOf(OversoldError);
    await expect(app.update.execute(lea, bought.id, { ...purchase, asset: 'NOPE' })).rejects.toBeInstanceOf(AssetNotFoundError);
    // Quantité réduite mais suffisante pour la vente.
    await app.update.execute(lea, bought.id, { ...purchase, quantity: 4 });
  });

  it('adds a newly chosen asset to my watchlist', async () => {
    const app = setupPurchases();
    app.market.instruments.push({ symbol: 'CW8.PA', isin: 'LU1681043599', name: 'Amundi MSCI World', currency: 'EUR' });
    const { id } = await app.create.execute(lea, purchase);
    await app.update.execute(lea, id, { ...purchase, asset: 'LU1681043599' });
    expect(app.purchases.rows[0].symbol).toBe('CW8.PA');
    expect(app.watches.rows.map((w) => w.symbol)).toEqual(['AI.PA', 'CW8.PA']);
    await app.update.execute(lea, id, { ...purchase, asset: 'LU1681043599', fees: 0 });
    expect(app.watches.rows).toHaveLength(2);
  });
});
