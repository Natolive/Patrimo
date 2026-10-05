import { Injectable } from '@nestjs/common';
import type { PageDto, PurchaseDto, PurchasesQueryDto, UserDto } from '@patrimo/shared';
import { PurchaseRepository } from '../domain/purchase.repository.js';
import { toPurchaseDto } from '../domain/to-purchase-dto.js';

@Injectable()
export class FindPurchasesService {
  constructor(private readonly purchases: PurchaseRepository) {}

  // Page d'opérations, les plus récentes d'abord.
  async execute(user: UserDto, query: PurchasesQueryDto): Promise<PageDto<PurchaseDto>> {
    const { items, total } = await this.purchases.findPageByUser(user.id, query);
    return { items: items.map(toPurchaseDto), total };
  }
}
