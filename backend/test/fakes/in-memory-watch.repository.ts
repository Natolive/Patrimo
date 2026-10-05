import type { NewWatch } from '@src/watchlist/domain/new-watch.entity.js';
import type { Watch } from '@src/watchlist/domain/watch.entity.js';
import { WatchRepository } from '@src/watchlist/domain/watch.repository.js';
import { InMemoryRepository } from './in-memory.repository.js';

export class InMemoryWatchRepository extends InMemoryRepository<Watch, NewWatch> implements WatchRepository {
  // Même défaut que la colonne en base.
  override create(data: NewWatch) {
    return super.create({ newsQuery: null, ...data });
  }

  async findByUser(userId: string) {
    return this.rows.filter((w) => w.userId === userId);
  }
}
