import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq } from 'drizzle-orm';
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

  async findPageByUser(userId: string, { offset, limit, symbol }: { offset: number; limit: number; symbol?: string }) {
    const where = and(eq(purchases.userId, userId), symbol ? eq(purchases.symbol, symbol) : undefined);
    const [items, [{ total }]] = await Promise.all([
      this.db.select().from(purchases).where(where).orderBy(desc(purchases.boughtAt), desc(purchases.createdAt)).offset(offset).limit(limit),
      this.db.select({ total: count() }).from(purchases).where(where),
    ]);
    return { items, total };
  }

  findByUser(userId: string): Promise<Purchase[]> {
    return this.db.select().from(purchases).where(eq(purchases.userId, userId)).orderBy(asc(purchases.boughtAt), asc(purchases.createdAt));
  }
}
