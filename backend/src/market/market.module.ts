import { Module } from '@nestjs/common';
import { MarketData } from './domain/market-data.js';
import { YahooMarketData } from './infrastructure/yahoo-market-data.js';

@Module({
  providers: [{ provide: MarketData, useClass: YahooMarketData }],
  exports: [MarketData],
})
export class MarketModule {}
