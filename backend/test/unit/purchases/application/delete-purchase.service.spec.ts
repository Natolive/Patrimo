import { PurchaseNotFoundError } from '@src/purchases/domain/errors/purchase-not-found.error.js';
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
});
