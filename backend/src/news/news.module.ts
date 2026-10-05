import { Module } from '@nestjs/common';
import { NewsFeed } from './domain/news-feed.js';
import { GoogleNewsFeed } from './infrastructure/google-news-feed.js';

@Module({
  providers: [{ provide: NewsFeed, useClass: GoogleNewsFeed }],
  exports: [NewsFeed],
})
export class NewsModule {}
