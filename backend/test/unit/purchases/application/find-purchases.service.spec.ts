import { lea, max, purchase, setupPurchases } from './setup.js';

describe('FindPurchasesService', () => {
  it('lists only my purchases, latest first', async () => {
    const app = setupPurchases();
    await app.create.execute(lea, purchase);
    await app.create.execute(lea, { ...purchase, boughtAt: '2026-01-05' });
    await app.create.execute(max, purchase);
    expect((await app.find.execute(lea)).map((p) => p.boughtAt)).toEqual(['2026-01-05', '2026-01-02']);
  });
});
