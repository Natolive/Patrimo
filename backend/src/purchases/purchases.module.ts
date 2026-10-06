import { Module } from '@nestjs/common';
import { MarketModule } from '../market/market.module.js';
import { WatchlistModule } from '../watchlist/watchlist.module.js';
import { CreatePurchaseService } from './application/create-purchase.service.js';
import { DeletePurchaseService } from './application/delete-purchase.service.js';
import { FindPurchasesService } from './application/find-purchases.service.js';
import { UpdatePurchaseService } from './application/update-purchase.service.js';
import { PurchaseRepository } from './domain/purchase.repository.js';
import { DrizzlePurchaseRepository } from './infrastructure/drizzle-purchase.repository.js';
import { PurchasesController } from './infrastructure/http/purchases.controller.js';

@Module({
  imports: [MarketModule, WatchlistModule],
  controllers: [PurchasesController],
  providers: [
    CreatePurchaseService,
    DeletePurchaseService,
    FindPurchasesService,
    UpdatePurchaseService,
    { provide: PurchaseRepository, useClass: DrizzlePurchaseRepository },
  ],
  exports: [PurchaseRepository],
})
export class PurchasesModule {}
