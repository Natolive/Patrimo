import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './common/infrastructure/database/database.module.js';
import { DomainErrorFilter } from './common/infrastructure/http/domain-error.filter.js';
import { PortfolioModule } from './portfolio/portfolio.module.js';
import { PurchasesModule } from './purchases/purchases.module.js';
import { WatchlistModule } from './watchlist/watchlist.module.js';

@Module({
  imports: [DatabaseModule, AuthModule, PurchasesModule, PortfolioModule, WatchlistModule],
  controllers: [AppController],
  providers: [{ provide: APP_FILTER, useClass: DomainErrorFilter }],
})
export class AppModule {}
