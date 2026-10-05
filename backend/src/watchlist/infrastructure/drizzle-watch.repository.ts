import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DB, type Database } from '../../common/infrastructure/database/database.module.js';
import { DrizzleRepository } from '../../common/infrastructure/database/drizzle.repository.js';
import type { NewWatch } from '../domain/new-watch.entity.js';
import type { Watch } from '../domain/watch.entity.js';
import { WatchRepository } from '../domain/watch.repository.js';
import { watches } from './watch.table.js';

@Injectable()
export class DrizzleWatchRepository extends DrizzleRepository<typeof watches, Watch, NewWatch> implements WatchRepository {
  constructor(@Inject(DB) db: Database) {
    super(db, watches);
  }

  findByUser(userId: string): Promise<Watch[]> {
    return this.db.select().from(watches).where(eq(watches.userId, userId)).orderBy(asc(watches.createdAt));
  }
}
