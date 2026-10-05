import { BaseRepository } from '../../common/domain/base.repository.js';
import type { NewWatch } from './new-watch.entity.js';
import type { Watch } from './watch.entity.js';

export abstract class WatchRepository extends BaseRepository<Watch, NewWatch> {
  // Par ordre d'ajout.
  abstract findByUser(userId: string): Promise<Watch[]>;
}
