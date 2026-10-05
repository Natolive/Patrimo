import { DrizzleUserRepository } from '@src/users/infrastructure/drizzle-user.repository.js';
import { users as usersTable } from '@src/users/infrastructure/user.table.js';
import { DrizzleWatchRepository } from '@src/watchlist/infrastructure/drizzle-watch.repository.js';
import { ConflictError } from '@src/common/domain/errors/conflict.error.js';
import { connect, person } from '@test/integration/database.js';
import { eq } from 'drizzle-orm';

describe('DrizzleWatchRepository', () => {
  const db = connect();
  const watches = new DrizzleWatchRepository(db);
  const email = `int-watch-${Date.now()}@example.com`;

  afterAll(async () => {
    // Les valeurs suivies partent en cascade avec le compte.
    await db.delete(usersTable).where(eq(usersTable.email, email));
    await db.$client.end();
  });

  it('lists my values in the order I followed them, each once', async () => {
    const { id: userId } = await new DrizzleUserRepository(db).create(person(email));
    await watches.create({ userId, symbol: 'MC.PA', name: 'LVMH', currency: 'EUR' });
    await watches.create({ userId, symbol: 'AI.PA', name: 'Air Liquide', currency: 'EUR' });
    expect((await watches.findByUser(userId)).map((w) => w.symbol)).toEqual(['MC.PA', 'AI.PA']);
    await expect(watches.create({ userId, symbol: 'AI.PA', name: 'Air Liquide', currency: 'EUR' })).rejects.toBeInstanceOf(ConflictError);
  });
});
