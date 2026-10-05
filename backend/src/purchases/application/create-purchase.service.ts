import { Injectable } from '@nestjs/common';
import type { PurchaseDto, SavePurchaseDto, UserDto } from '@patrimo/shared';
import { AssetNotFoundError } from '../../market/domain/errors/asset-not-found.error.js';
import { MarketData } from '../../market/domain/market-data.js';
import { findOversold } from '../../portfolio/domain/holding.js';
import { WatchRepository } from '../../watchlist/domain/watch.repository.js';
import { OversoldError } from '../domain/errors/oversold.error.js';
import { PurchaseRepository } from '../domain/purchase.repository.js';
import { toPurchaseDto } from '../domain/to-purchase-dto.js';

@Injectable()
export class CreatePurchaseService {
  constructor(
    private readonly purchases: PurchaseRepository,
    private readonly watches: WatchRepository,
    private readonly market: MarketData,
  ) {}

  // Une vente ne peut porter que sur des titres détenus à sa date ; la valeur rejoint la liste de suivi.
  async execute(user: UserDto, { asset, ...dto }: SavePurchaseDto): Promise<PurchaseDto> {
    const instrument = await this.market.search(asset);
    if (!instrument) throw new AssetNotFoundError(asset);
    const trade = { ...dto, ...instrument, userId: user.id };

    const existing = await this.purchases.findByUser(user.id);
    // Les opérations déjà saisies sont cohérentes : toute vente à découvert vient de la nouvelle (elle-même ou une vente postérieure).
    if (findOversold([...existing, { ...trade, id: 'new', createdAt: new Date() }])) throw new OversoldError(instrument.name, dto.boughtAt);

    const purchase = await this.purchases.create(trade);
    if (!(await this.watches.findByUser(user.id)).some((w) => w.symbol === instrument.symbol)) await this.watches.create({ ...instrument, userId: user.id });
    return toPurchaseDto(purchase);
  }
}
