import { Module } from '@nestjs/common';
import { FindLastPriceService } from './application/find-last-price.service.js';
import { FindMarketSessionsService } from './application/find-market-sessions.service.js';
import { SearchAssetsService } from './application/search-assets.service.js';
import { MarketData } from './domain/market-data.js';
import { MarketsController } from './infrastructure/http/markets.controller.js';
import { YahooMarketData } from './infrastructure/yahoo-market-data.js';

@Module({
  controllers: [MarketsController],
  providers: [FindLastPriceService, FindMarketSessionsService, SearchAssetsService, { provide: MarketData, useClass: YahooMarketData }],
  exports: [MarketData],
})
export class MarketModule {}
