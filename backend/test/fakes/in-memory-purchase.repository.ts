import type { NewPurchase } from '@src/purchases/domain/new-purchase.entity.js';
import type { Purchase } from '@src/purchases/domain/purchase.entity.js';
import { PurchaseRepository } from '@src/purchases/domain/purchase.repository.js';
import { InMemoryRepository } from './in-memory.repository.js';

export class InMemoryPurchaseRepository extends InMemoryRepository<Purchase, NewPurchase> implements PurchaseRepository {
  async findPageByUser(userId: string, { offset, limit, symbol }: { offset: number; limit: number; symbol?: string }) {
    const mine = (await this.findByUser(userId)).filter((p) => !symbol || p.symbol === symbol).reverse();
    return { items: mine.slice(offset, offset + limit), total: mine.length };
  }

  async findByUser(userId: string) {
    return this.rows.filter((p) => p.userId === userId).toSorted((a, b) => a.boughtAt.localeCompare(b.boughtAt));
  }
}
