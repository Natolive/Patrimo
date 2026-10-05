import { Module } from '@nestjs/common';
import { MarketModule } from '../market/market.module.js';
import { CreateWatchService } from './application/create-watch.service.js';
import { DeleteWatchService } from './application/delete-watch.service.js';
import { FindWatchesService } from './application/find-watches.service.js';
import { WatchRepository } from './domain/watch.repository.js';
import { DrizzleWatchRepository } from './infrastructure/drizzle-watch.repository.js';
import { WatchesController } from './infrastructure/http/watches.controller.js';

@Module({
  imports: [MarketModule],
  controllers: [WatchesController],
  providers: [CreateWatchService, DeleteWatchService, FindWatchesService, { provide: WatchRepository, useClass: DrizzleWatchRepository }],
  exports: [WatchRepository],
})
export class WatchlistModule {}
