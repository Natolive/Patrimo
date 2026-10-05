import { Module } from '@nestjs/common';
import { MarketModule } from '../market/market.module.js';
import { PurchasesModule } from '../purchases/purchases.module.js';
import { WatchlistModule } from '../watchlist/watchlist.module.js';
import { FindAssetService } from './application/find-asset.service.js';
import { FindPortfolioService } from './application/find-portfolio.service.js';
import { PortfolioController } from './infrastructure/http/portfolio.controller.js';

@Module({
  imports: [MarketModule, PurchasesModule, WatchlistModule],
  controllers: [PortfolioController],
  providers: [FindAssetService, FindPortfolioService],
})
export class PortfolioModule {}
