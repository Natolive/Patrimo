import { AssetNotFoundError } from '@src/market/domain/errors/asset-not-found.error.js';
import { CreateWatchService } from '@src/watchlist/application/create-watch.service.js';
import { DeleteWatchService } from '@src/watchlist/application/delete-watch.service.js';
import { FindWatchesService } from '@src/watchlist/application/find-watches.service.js';
import { AlreadyWatchedError } from '@src/watchlist/domain/errors/already-watched.error.js';
import { WatchNotFoundError } from '@src/watchlist/domain/errors/watch-not-found.error.js';
import { FakeMarketData } from '@test/fakes/fake-market-data.js';
import { InMemoryWatchRepository } from '@test/fakes/in-memory-watch.repository.js';
import { lea, max } from '../../purchases/application/setup.js';

function setup() {
  const watches = new InMemoryWatchRepository();
  const market = new FakeMarketData();
  return {
    watches,
    create: new CreateWatchService(watches, market),
    find: new FindWatchesService(watches, market),
    delete: new DeleteWatchService(watches),
  };
}

describe('Watchlist', () => {
  it('follows a value from its ISIN, with its quote', async () => {
    const app = setup();
    const watch = await app.create.execute(lea, { asset: 'FR0000120073' });
    expect(watch).toMatchObject({ id: '1', symbol: 'AI.PA', name: "L'Air Liquide S.A.", price: 120 });
    expect(watch.dayChangeRate).toBeCloseTo(120 / 110 - 1);
    expect(await app.find.execute(lea)).toEqual([watch]);
    expect(await app.find.execute(max)).toEqual([]);
  });

  it('refuses an unknown value or one already followed', async () => {
    const app = setup();
    await expect(app.create.execute(lea, { asset: 'NOPE' })).rejects.toBeInstanceOf(AssetNotFoundError);
    await app.create.execute(lea, { asset: 'FR0000120073' });
    await expect(app.create.execute(lea, { asset: 'AI.PA' })).rejects.toBeInstanceOf(AlreadyWatchedError);
    await app.create.execute(max, { asset: 'AI.PA' });
    expect(app.watches.rows).toHaveLength(2);
  });

  it('stops following my value only', async () => {
    const app = setup();
    const { id } = await app.create.execute(lea, { asset: 'AI.PA' });
    await expect(app.delete.execute(max, id)).rejects.toBeInstanceOf(WatchNotFoundError);
    await app.delete.execute(lea, id);
    expect(app.watches.rows).toHaveLength(0);
  });
});
