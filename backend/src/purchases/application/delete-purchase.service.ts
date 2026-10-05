import { Injectable } from '@nestjs/common';
import type { UserDto } from '@patrimo/shared';
import { findOversold } from '../../portfolio/domain/holding.js';
import { PurchaseNotFoundError } from '../domain/errors/purchase-not-found.error.js';
import { SaleLeftUncoveredError } from '../domain/errors/sale-left-uncovered.error.js';
import { PurchaseRepository } from '../domain/purchase.repository.js';

@Injectable()
export class DeletePurchaseService {
  constructor(private readonly purchases: PurchaseRepository) {}

  // L'opération d'un autre compte répond comme une opération inexistante ; un achat dont dépend une vente reste.
  async execute(user: UserDto, id: string): Promise<void> {
    const purchase = await this.purchases.findById(id);
    if (purchase?.userId !== user.id) throw new PurchaseNotFoundError();
    const oversold = findOversold((await this.purchases.findByUser(user.id)).filter((p) => p.id !== id));
    if (oversold) throw new SaleLeftUncoveredError(oversold.boughtAt);
    await this.purchases.delete(id);
  }
}
