import { Injectable } from '@nestjs/common';
import type { PurchaseDto, SavePurchaseDto, UserDto } from '@patrimo/shared';
import { AssetNotFoundError } from '../../market/domain/errors/asset-not-found.error.js';
import { MarketData } from '../../market/domain/market-data.js';
import { findOversold } from '../../portfolio/domain/holding.js';
import { WatchRepository } from '../../watchlist/domain/watch.repository.js';
import { OversoldError } from '../domain/errors/oversold.error.js';
import { PurchaseNotFoundError } from '../domain/errors/purchase-not-found.error.js';
import { PurchaseRepository } from '../domain/purchase.repository.js';
import { toPurchaseDto } from '../domain/to-purchase-dto.js';

@Injectable()
export class UpdatePurchaseService {
  constructor(
    private readonly purchases: PurchaseRepository,
    private readonly watches: WatchRepository,
    private readonly market: MarketData,
  ) {}

  // Correction d'une opération (ex. frais remboursés) : mêmes règles qu'à la saisie, l'opération d'un autre compte répond comme inexistante.
  async execute(user: UserDto, id: string, { asset, ...dto }: SavePurchaseDto): Promise<PurchaseDto> {
    const current = await this.purchases.findById(id);
    if (current?.userId !== user.id) throw new PurchaseNotFoundError();
    const instrument = await this.market.search(asset);
    if (!instrument) throw new AssetNotFoundError(asset);
    const trade = { ...dto, ...instrument };

    const others = (await this.purchases.findByUser(user.id)).filter((p) => p.id !== id);
    const oversold = findOversold([...others, { ...current, ...trade }]);
    if (oversold) throw new OversoldError(oversold.name, oversold.boughtAt);

    const purchase = (await this.purchases.update(id, trade))!;
    if (!(await this.watches.findByUser(user.id)).some((w) => w.symbol === instrument.symbol)) await this.watches.create({ ...instrument, userId: user.id });
    return toPurchaseDto(purchase);
  }
}
