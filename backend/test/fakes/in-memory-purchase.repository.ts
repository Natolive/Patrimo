import type { NewPurchase } from '@src/purchases/domain/new-purchase.entity.js';
import type { Purchase } from '@src/purchases/domain/purchase.entity.js';
import { PurchaseRepository } from '@src/purchases/domain/purchase.repository.js';
import { InMemoryRepository } from './in-memory.repository.js';

export class InMemoryPurchaseRepository extends InMemoryRepository<Purchase, NewPurchase> implements PurchaseRepository {
  async findByUser(userId: string) {
    return this.rows.filter((p) => p.userId === userId).toSorted((a, b) => a.boughtAt.localeCompare(b.boughtAt));
  }
}
