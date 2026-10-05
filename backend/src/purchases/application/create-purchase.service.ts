import { Injectable } from '@nestjs/common';
import type { PurchaseDto, SavePurchaseDto, UserDto } from '@pea/shared';
import { AssetNotFoundError } from '../../market/domain/errors/asset-not-found.error.js';
import { MarketData } from '../../market/domain/market-data.js';
import { PurchaseRepository } from '../domain/purchase.repository.js';
import { toPurchaseDto } from '../domain/to-purchase-dto.js';

@Injectable()
export class CreatePurchaseService {
  constructor(
    private readonly purchases: PurchaseRepository,
    private readonly market: MarketData,
  ) {}

  async execute(user: UserDto, { asset, ...dto }: SavePurchaseDto): Promise<PurchaseDto> {
    const instrument = await this.market.search(asset);
    if (!instrument) throw new AssetNotFoundError(asset);
    return toPurchaseDto(await this.purchases.create({ ...dto, ...instrument, userId: user.id }));
  }
}
