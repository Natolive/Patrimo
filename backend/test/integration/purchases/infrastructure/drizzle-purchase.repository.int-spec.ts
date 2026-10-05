import { DrizzlePurchaseRepository } from '@src/purchases/infrastructure/drizzle-purchase.repository.js';
import { DrizzleUserRepository } from '@src/users/infrastructure/drizzle-user.repository.js';
import { users as usersTable } from '@src/users/infrastructure/user.table.js';
import { connect, person } from '@test/integration/database.js';
import { eq } from 'drizzle-orm';

describe('DrizzlePurchaseRepository', () => {
  const db = connect();
  const purchases = new DrizzlePurchaseRepository(db);
  const email = `int-purchase-${Date.now()}@example.com`;

  afterAll(async () => {
    // Les achats partent en cascade avec le compte.
    await db.delete(usersTable).where(eq(usersTable.email, email));
    await db.$client.end();
  });

  it('keeps exact amounts as numbers and lists my purchases oldest first', async () => {
    const { id: userId } = await new DrizzleUserRepository(db).create(person(email));
    const base = { side: 'buy' as const, userId, symbol: 'AI.PA', name: 'Air Liquide', currency: 'EUR', quantity: 0.5, unitPrice: 171.58, fees: 1.99 };
    await purchases.create({ ...base, boughtAt: '2026-03-02' });
    await purchases.create({ ...base, boughtAt: '2026-01-15' });

    await purchases.create({ ...base, symbol: 'CW8.PA', boughtAt: '2026-02-01' });
    expect(await purchases.findPageByUser(userId, { offset: 0, limit: 2 })).toMatchObject({
      total: 3,
      items: [{ boughtAt: '2026-03-02' }, { boughtAt: '2026-02-01' }],
    });
    expect(await purchases.findPageByUser(userId, { offset: 0, limit: 20, symbol: 'AI.PA' })).toMatchObject({ total: 2, items: [{ boughtAt: '2026-03-02' }, { boughtAt: '2026-01-15' }] });

    const found = (await purchases.findByUser(userId)).filter((p) => p.symbol === 'AI.PA');
    expect(found.map((p) => p.boughtAt)).toEqual(['2026-01-15', '2026-03-02']);
    expect(found[0]).toMatchObject({ quantity: 0.5, unitPrice: 171.58, fees: 1.99 });
  });
});
