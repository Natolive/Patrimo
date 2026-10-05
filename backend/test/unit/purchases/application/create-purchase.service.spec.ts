import { AssetNotFoundError } from '@src/market/domain/errors/asset-not-found.error.js';
import { OversoldError } from '@src/purchases/domain/errors/oversold.error.js';
import { lea, max, purchase, setupPurchases } from './setup.js';

const sale = { ...purchase, side: 'sell' as const, boughtAt: '2026-01-05', quantity: 4, unitPrice: 110, fees: 1 };

describe('CreatePurchaseService', () => {
  it('finds the asset from its ISIN and saves the purchase with its total', async () => {
    const app = setupPurchases();
    expect(await app.create.execute(lea, purchase)).toEqual({
      id: '1',
      side: 'buy',
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

  it('records a sale of shares held, its total net of fees', async () => {
    const app = setupPurchases();
    await app.create.execute(lea, purchase);
    expect(await app.create.execute(lea, sale)).toMatchObject({ side: 'sell', quantity: 4, total: 439 });
    // Le reste peut aussi être vendu le même jour que l'achat.
    await app.create.execute(lea, { ...sale, boughtAt: '2026-01-02', quantity: 6 });
  });

  it('refuses to sell more shares than held at that date, whoever holds others', async () => {
    const app = setupPurchases();
    await app.create.execute(max, purchase);
    await expect(app.create.execute(lea, sale)).rejects.toBeInstanceOf(OversoldError);
    await app.create.execute(lea, purchase);
    await expect(app.create.execute(lea, { ...sale, boughtAt: '2026-01-01' })).rejects.toBeInstanceOf(OversoldError);
    await expect(app.create.execute(lea, { ...sale, quantity: 11 })).rejects.toBeInstanceOf(OversoldError);
    // Une vente antérieure qui laisserait une vente déjà saisie à découvert.
    await app.create.execute(lea, { ...sale, boughtAt: '2026-01-06', quantity: 10 });
    await expect(app.create.execute(lea, { ...sale, quantity: 1 })).rejects.toBeInstanceOf(OversoldError);
    expect(app.purchases.rows).toHaveLength(3);
  });

  it('adds the value to my watchlist once', async () => {
    const app = setupPurchases();
    await app.create.execute(lea, purchase);
    await app.create.execute(lea, { ...purchase, asset: 'AI.PA' });
    await app.create.execute(max, purchase);
    expect(app.watches.rows.map((w) => [w.userId, w.symbol])).toEqual([
      ['lea', 'AI.PA'],
      ['max', 'AI.PA'],
    ]);
  });

  it('refuses an asset the market does not know', async () => {
    const app = setupPurchases();
    await expect(app.create.execute(lea, { ...purchase, asset: 'NOPE' })).rejects.toBeInstanceOf(AssetNotFoundError);
    expect(app.purchases.rows).toHaveLength(0);
  });
});
