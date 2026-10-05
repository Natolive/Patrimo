import { Module } from '@nestjs/common';
import { MarketModule } from '../market/market.module.js';
import { CreatePurchaseService } from './application/create-purchase.service.js';
import { DeletePurchaseService } from './application/delete-purchase.service.js';
import { FindPurchasesService } from './application/find-purchases.service.js';
import { PurchaseRepository } from './domain/purchase.repository.js';
import { DrizzlePurchaseRepository } from './infrastructure/drizzle-purchase.repository.js';
import { PurchasesController } from './infrastructure/http/purchases.controller.js';

@Module({
  imports: [MarketModule],
  controllers: [PurchasesController],
  providers: [
    CreatePurchaseService,
    DeletePurchaseService,
    FindPurchasesService,
    { provide: PurchaseRepository, useClass: DrizzlePurchaseRepository },
  ],
  exports: [PurchaseRepository],
})
export class PurchasesModule {}
