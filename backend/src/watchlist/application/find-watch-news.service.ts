import { Injectable } from '@nestjs/common';
import type { UserDto, WatchNewsDto } from '@pea/shared';
import { NewsFeed } from '../../news/domain/news-feed.js';
import { suggestNewsQuery } from '../../news/domain/suggest-news-query.js';
import { findMyWatch } from './find-my-watch.js';
import { WatchRepository } from '../domain/watch.repository.js';

@Injectable()
export class FindWatchNewsService {
  constructor(
    private readonly watches: WatchRepository,
    private readonly news: NewsFeed,
  ) {}

  async execute(user: UserDto, id: string): Promise<WatchNewsDto> {
    const watch = await findMyWatch(this.watches, user, id);
    const query = watch.newsQuery ?? suggestNewsQuery(watch.name);
    const items = await this.news.search(query);
    return { query, suggested: watch.newsQuery === null, items: items.map((i) => ({ ...i, publishedAt: i.publishedAt.toISOString() })) };
  }
}
