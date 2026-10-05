import { lea, max, purchase, setupPurchases } from './setup.js';

describe('FindPurchasesService', () => {
  it('pages only my purchases, latest first, with their total', async () => {
    const app = setupPurchases();
    await app.create.execute(lea, purchase);
    await app.create.execute(lea, { ...purchase, boughtAt: '2026-01-05' });
    await app.create.execute(lea, { ...purchase, boughtAt: '2026-01-06' });
    await app.create.execute(max, purchase);
    const first = await app.find.execute(lea, { offset: 0, limit: 2 });
    expect(first).toMatchObject({ total: 3, items: [{ boughtAt: '2026-01-06' }, { boughtAt: '2026-01-05' }] });
    expect((await app.find.execute(lea, { offset: 2, limit: 2 })).items.map((p) => p.boughtAt)).toEqual(['2026-01-02']);
  });

  it('pages the purchases of a single value', async () => {
    const app = setupPurchases();
    app.market.instruments.push({ symbol: 'CW8.PA', isin: 'LU1681043599', name: 'Amundi MSCI World', currency: 'EUR' });
    await app.create.execute(lea, purchase);
    await app.create.execute(lea, { ...purchase, asset: 'CW8.PA' });
    expect(await app.find.execute(lea, { offset: 0, limit: 20, symbol: 'CW8.PA' })).toMatchObject({ total: 1, items: [{ symbol: 'CW8.PA' }] });
  });
});
