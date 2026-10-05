import { BaseRepository } from '../../common/domain/base.repository.js';
import type { NewPurchase } from './new-purchase.entity.js';
import type { Purchase } from './purchase.entity.js';

export abstract class PurchaseRepository extends BaseRepository<Purchase, NewPurchase> {
  // Du plus ancien au plus récent.
  abstract findByUser(userId: string): Promise<Purchase[]>;
}
