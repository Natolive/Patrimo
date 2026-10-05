import type { NewWatch } from '@src/watchlist/domain/new-watch.entity.js';
import type { Watch } from '@src/watchlist/domain/watch.entity.js';
import { WatchRepository } from '@src/watchlist/domain/watch.repository.js';
import { InMemoryRepository } from './in-memory.repository.js';

export class InMemoryWatchRepository extends InMemoryRepository<Watch, NewWatch> implements WatchRepository {
  async findByUser(userId: string) {
    return this.rows.filter((w) => w.userId === userId);
  }
}
