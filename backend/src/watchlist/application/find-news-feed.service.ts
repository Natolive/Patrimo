import { Injectable } from '@nestjs/common';
import type { FeedItemDto, UserDto } from '@patrimo/shared';
import { NewsFeed } from '../../news/domain/news-feed.js';
import { suggestNewsQuery } from '../../news/domain/suggest-news-query.js';
import { WatchRepository } from '../domain/watch.repository.js';

const LIMIT = 20;

// Fil de l'accueil : actualités de toutes mes valeurs suivies, les plus récentes d'abord, chaque dépêche une fois.
@Injectable()
export class FindNewsFeedService {
  constructor(
    private readonly watches: WatchRepository,
    private readonly news: NewsFeed,
  ) {}

  async execute(user: UserDto): Promise<FeedItemDto[]> {
    const watches = await this.watches.findByUser(user.id);
    const results = await Promise.all(watches.map(async (w) => ({ watch: w, items: await this.news.search(w.newsQuery ?? suggestNewsQuery(w.name)) })));
    const byTitle = new Map<string, FeedItemDto>();
    for (const { watch, items } of results)
      for (const item of items) {
        const entry = byTitle.get(item.title) ?? { ...item, publishedAt: item.publishedAt.toISOString(), assets: [] };
        entry.assets.push({ symbol: watch.symbol, name: watch.name });
        byTitle.set(item.title, entry);
      }
    return [...byTitle.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, LIMIT);
  }
}
