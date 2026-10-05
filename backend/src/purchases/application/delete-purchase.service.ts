import { Injectable } from '@nestjs/common';
import type { UserDto } from '@pea/shared';
import { PurchaseNotFoundError } from '../domain/errors/purchase-not-found.error.js';
import { PurchaseRepository } from '../domain/purchase.repository.js';

@Injectable()
export class DeletePurchaseService {
  constructor(private readonly purchases: PurchaseRepository) {}

  // L'achat d'un autre compte répond comme un achat inexistant.
  async execute(user: UserDto, id: string): Promise<void> {
    const purchase = await this.purchases.findById(id);
    if (purchase?.userId !== user.id) throw new PurchaseNotFoundError();
    await this.purchases.delete(id);
  }
}
