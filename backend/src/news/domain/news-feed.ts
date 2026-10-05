import type { NewsItem } from './news-item.entity.js';

export abstract class NewsFeed {
  // Articles récents en français sur ces mots-clés, du plus récent au plus ancien.
  abstract search(query: string): Promise<NewsItem[]>;
}
