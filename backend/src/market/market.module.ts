import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { FindCandlesService } from './application/find-candles.service.js';
import { FindLastPriceService } from './application/find-last-price.service.js';
import { FindMarketSessionsService } from './application/find-market-sessions.service.js';
import { SearchAssetsService } from './application/search-assets.service.js';
import { StreamPricesService } from './application/stream-prices.service.js';
import { MarketData } from './domain/market-data.js';
import { PriceStream } from './domain/price-stream.js';
import { MarketsController } from './infrastructure/http/markets.controller.js';
import { PricesGateway } from './infrastructure/ws/prices.gateway.js';
import { YahooMarketData } from './infrastructure/yahoo-market-data.js';
import { YahooPriceStream } from './infrastructure/yahoo-price-stream.js';

@Module({
  imports: [AuthModule],
  controllers: [MarketsController],
  providers: [
    FindCandlesService,
    FindLastPriceService,
    FindMarketSessionsService,
    SearchAssetsService,
    StreamPricesService,
    PricesGateway,
    { provide: MarketData, useClass: YahooMarketData },
    { provide: PriceStream, useClass: YahooPriceStream },
  ],
  exports: [MarketData],
})
export class MarketModule {}
