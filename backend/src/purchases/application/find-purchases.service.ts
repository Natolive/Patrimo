import { Injectable } from '@nestjs/common';
import type { PurchaseDto, UserDto } from '@pea/shared';
import { PurchaseRepository } from '../domain/purchase.repository.js';
import { toPurchaseDto } from '../domain/to-purchase-dto.js';

@Injectable()
export class FindPurchasesService {
  constructor(private readonly purchases: PurchaseRepository) {}

  // Les plus récents d'abord.
  async execute(user: UserDto): Promise<PurchaseDto[]> {
    return (await this.purchases.findByUser(user.id)).map(toPurchaseDto).reverse();
  }
}
