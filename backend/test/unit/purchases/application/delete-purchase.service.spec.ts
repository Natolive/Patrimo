import { PurchaseNotFoundError } from '@src/purchases/domain/errors/purchase-not-found.error.js';
import { SaleLeftUncoveredError } from '@src/purchases/domain/errors/sale-left-uncovered.error.js';
import { lea, max, purchase, setupPurchases } from './setup.js';

describe('DeletePurchaseService', () => {
  it('deletes my purchase', async () => {
    const app = setupPurchases();
    const { id } = await app.create.execute(lea, purchase);
    await app.delete.execute(lea, id);
    expect(app.purchases.rows).toHaveLength(0);
  });

  it("answers not found for someone else's purchase or an unknown one", async () => {
    const app = setupPurchases();
    const { id } = await app.create.execute(lea, purchase);
    await expect(app.delete.execute(max, id)).rejects.toBeInstanceOf(PurchaseNotFoundError);
    await expect(app.delete.execute(lea, 'unknown')).rejects.toBeInstanceOf(PurchaseNotFoundError);
    expect(app.purchases.rows).toHaveLength(1);
  });

  it('keeps a purchase a sale depends on, until the sale is deleted', async () => {
    const app = setupPurchases();
    const bought = await app.create.execute(lea, purchase);
    const sold = await app.create.execute(lea, { ...purchase, side: 'sell', boughtAt: '2026-01-05', quantity: 4 });
    await expect(app.delete.execute(lea, bought.id)).rejects.toBeInstanceOf(SaleLeftUncoveredError);
    await app.delete.execute(lea, sold.id);
    await app.delete.execute(lea, bought.id);
    expect(app.purchases.rows).toHaveLength(0);
  });
});
