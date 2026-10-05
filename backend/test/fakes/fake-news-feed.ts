import { NewsFeed } from '@src/news/domain/news-feed.js';

// Un article par recherche, qui reprend les mots-clés : le test voit ce qui a été cherché.
export class FakeNewsFeed extends NewsFeed {
  async search(query: string) {
    return [{ title: `À propos de ${query}`, url: 'https://example.com/article', source: 'Exemple', sourceDomain: 'example.com', publishedAt: new Date('2026-10-05T08:00:00Z') }];
  }
}
