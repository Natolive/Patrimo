import { Injectable } from '@nestjs/common';
import type { AssetDto, UserDto } from '@pea/shared';
import { MarketData } from '../../market/domain/market-data.js';
import { PurchaseRepository } from '../../purchases/domain/purchase.repository.js';
import { toPurchaseDto } from '../../purchases/domain/to-purchase-dto.js';
import { WatchRepository } from '../../watchlist/domain/watch.repository.js';
import { buildQuote } from '../domain/build-quote.js';
import { AssetNotTrackedError } from '../domain/errors/asset-not-tracked.error.js';
import { movingAverage } from '../domain/moving-average.js';
import { FindPortfolioService } from './find-portfolio.service.js';

// Fiche d'une valeur détenue ou suivie ; une autre répond comme inconnue.
@Injectable()
export class FindAssetService {
  constructor(
    private readonly portfolio: FindPortfolioService,
    private readonly purchases: PurchaseRepository,
    private readonly watches: WatchRepository,
    private readonly market: MarketData,
  ) {}

  async execute(user: UserDto, symbol: string): Promise<AssetDto> {
    const purchases = (await this.purchases.findByUser(user.id)).filter((p) => p.symbol === symbol);
    const watch = (await this.watches.findByUser(user.id)).find((w) => w.symbol === symbol);
    const instrument = purchases[0] ?? watch;
    if (!instrument) throw new AssetNotTrackedError();

    // Historiques déjà en cache après le calcul du portefeuille (poids de la ligne compris).
    const position = purchases.length ? (await this.portfolio.execute(user)).positions.find((p) => p.symbol === symbol)! : null;
    const points = await this.market.history(symbol);
    const { previousClose: _, ...quote } = buildQuote(points);
    const closes = points.map((p) => p.close);
    const [sma50, sma200] = [movingAverage(closes, 50), movingAverage(closes, 200)];
    return {
      symbol,
      name: instrument.name,
      currency: instrument.currency,
      ...quote,
      position,
      watchId: watch?.id ?? null,
      points: points.map((p, i) => ({ ...p, sma50: sma50[i], sma200: sma200[i] })),
      purchases: purchases.map(toPurchaseDto).reverse(),
    };
  }
}
