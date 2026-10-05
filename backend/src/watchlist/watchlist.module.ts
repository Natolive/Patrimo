import { Module } from '@nestjs/common';
import { MarketModule } from '../market/market.module.js';
import { NewsModule } from '../news/news.module.js';
import { CreateWatchService } from './application/create-watch.service.js';
import { DeleteWatchService } from './application/delete-watch.service.js';
import { FindNewsFeedService } from './application/find-news-feed.service.js';
import { FindWatchNewsService } from './application/find-watch-news.service.js';
import { FindWatchesService } from './application/find-watches.service.js';
import { UpdateWatchService } from './application/update-watch.service.js';
import { WatchRepository } from './domain/watch.repository.js';
import { DrizzleWatchRepository } from './infrastructure/drizzle-watch.repository.js';
import { WatchesController } from './infrastructure/http/watches.controller.js';

@Module({
  imports: [MarketModule, NewsModule],
  controllers: [WatchesController],
  providers: [
    CreateWatchService,
    DeleteWatchService,
    FindNewsFeedService,
    FindWatchesService,
    FindWatchNewsService,
    UpdateWatchService,
    { provide: WatchRepository, useClass: DrizzleWatchRepository },
  ],
  exports: [WatchRepository],
})
export class WatchlistModule {}
