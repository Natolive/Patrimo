import { AssetNotFoundError } from '@src/market/domain/errors/asset-not-found.error.js';
import { CreateWatchService } from '@src/watchlist/application/create-watch.service.js';
import { DeleteWatchService } from '@src/watchlist/application/delete-watch.service.js';
import { FindNewsFeedService } from '@src/watchlist/application/find-news-feed.service.js';
import { FindWatchNewsService } from '@src/watchlist/application/find-watch-news.service.js';
import { FindWatchesService } from '@src/watchlist/application/find-watches.service.js';
import { UpdateWatchService } from '@src/watchlist/application/update-watch.service.js';
import { AlreadyWatchedError } from '@src/watchlist/domain/errors/already-watched.error.js';
import { WatchNotFoundError } from '@src/watchlist/domain/errors/watch-not-found.error.js';
import { FakeMarketData } from '@test/fakes/fake-market-data.js';
import { FakeNewsFeed } from '@test/fakes/fake-news-feed.js';
import { InMemoryWatchRepository } from '@test/fakes/in-memory-watch.repository.js';
import { lea, max } from '../../purchases/application/setup.js';

function setup() {
  const watches = new InMemoryWatchRepository();
  const market = new FakeMarketData();
  return {
    watches,
    market,
    create: new CreateWatchService(watches, market),
    find: new FindWatchesService(watches, market),
    delete: new DeleteWatchService(watches),
    update: new UpdateWatchService(watches),
    news: new FindWatchNewsService(watches, new FakeNewsFeed()),
    feed: new FindNewsFeedService(watches, new FakeNewsFeed()),
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

  it('searches the news of my value with the suggestion, then my own keywords, then the suggestion again', async () => {
    const app = setup();
    const { id } = await app.create.execute(lea, { asset: 'AI.PA' });
    expect(await app.news.execute(lea, id)).toEqual({
      query: "L'Air Liquide",
      suggested: true,
      items: [{ title: "À propos de L'Air Liquide", url: 'https://example.com/article', source: 'Exemple', sourceDomain: 'example.com', publishedAt: '2026-10-05T08:00:00.000Z' }],
    });
    await app.update.execute(lea, id, { newsQuery: 'Air Liquide hydrogène' });
    expect(await app.news.execute(lea, id)).toMatchObject({ query: 'Air Liquide hydrogène', suggested: false });
    await app.update.execute(lea, id, { newsQuery: null });
    expect(await app.news.execute(lea, id)).toMatchObject({ query: "L'Air Liquide", suggested: true });
  });

  it("does not show nor change someone else's keywords", async () => {
    const app = setup();
    const { id } = await app.create.execute(lea, { asset: 'AI.PA' });
    await expect(app.news.execute(max, id)).rejects.toBeInstanceOf(WatchNotFoundError);
    await expect(app.update.execute(max, id, { newsQuery: 'x' })).rejects.toBeInstanceOf(WatchNotFoundError);
  });

  it('merges the news of all my values, newest first, each article once with every value it concerns', async () => {
    const app = setup();
    app.market.instruments.push({ symbol: 'CW8.PA', isin: 'LU1681043599', name: 'Amundi MSCI World UCITS ETF', currency: 'EUR' });
    app.market.histories.set('CW8.PA', [{ date: '2026-01-06', close: 400 }]);
    const air = await app.create.execute(lea, { asset: 'AI.PA' });
    const world = await app.create.execute(lea, { asset: 'CW8.PA' });
    await app.create.execute(max, { asset: 'AI.PA' });
    // Même mots-clés que la suggestion de l'ETF : une seule dépêche, pour les deux valeurs.
    await app.update.execute(lea, air.id, { newsQuery: '"marchés mondiaux" OR "Wall Street" OR "MSCI World"' });

    const feed = await app.feed.execute(lea);
    expect(feed).toHaveLength(1);
    expect(feed[0].assets.map((a) => a.symbol)).toEqual(['AI.PA', 'CW8.PA']);
    await app.update.execute(lea, world.id, { newsQuery: 'MSCI' });
    expect((await app.feed.execute(lea)).map((i) => i.title)).toEqual(['À propos de "marchés mondiaux" OR "Wall Street" OR "MSCI World"', 'À propos de MSCI']);
    expect(await app.feed.execute({ ...lea, id: 'nobody' })).toEqual([]);
  });
});
