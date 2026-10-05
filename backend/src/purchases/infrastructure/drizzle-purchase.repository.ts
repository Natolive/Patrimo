import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DB, type Database } from '../../common/infrastructure/database/database.module.js';
import { DrizzleRepository } from '../../common/infrastructure/database/drizzle.repository.js';
import type { NewPurchase } from '../domain/new-purchase.entity.js';
import type { Purchase } from '../domain/purchase.entity.js';
import { PurchaseRepository } from '../domain/purchase.repository.js';
import { purchases } from './purchase.table.js';

@Injectable()
export class DrizzlePurchaseRepository extends DrizzleRepository<typeof purchases, Purchase, NewPurchase> implements PurchaseRepository {
  constructor(@Inject(DB) db: Database) {
    super(db, purchases);
  }

  findByUser(userId: string): Promise<Purchase[]> {
    return this.db.select().from(purchases).where(eq(purchases.userId, userId)).orderBy(asc(purchases.boughtAt), asc(purchases.createdAt));
  }
}
