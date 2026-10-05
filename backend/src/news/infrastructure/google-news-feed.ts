import { Injectable } from '@nestjs/common';
import { NewsFeed } from '../domain/news-feed.js';
import type { NewsItem } from '../domain/news-item.entity.js';

const CACHE_MS = 30 * 60 * 1000;
const LIMIT = 12;
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

const decode = (text: string) =>
  text.replace(/&(#\d+|amp|lt|gt|quot|apos);/g, (_, e: string) => (e.startsWith('#') ? String.fromCodePoint(Number(e.slice(1))) : ENTITIES[e]));
// « https://www.boursorama.com » → « boursorama.com ».
const domain = (url: string | undefined) => (url && URL.canParse(url) ? new URL(url).hostname.replace(/^www\./, '') : '');
const tag = (xml: string, name: string) => decode(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] ?? '').trim();

// Flux RSS public de Google Actualités, édition française, 14 derniers jours.
// ponytail: XML lu par expressions régulières (flux simple et stable) ; un vrai parseur si Google change le format. Cache en mémoire par processus.
@Injectable()
export class GoogleNewsFeed extends NewsFeed {
  private readonly cache = new Map<string, { at: number; items: NewsItem[] }>();

  async search(query: string, now = Date.now()): Promise<NewsItem[]> {
    const cached = this.cache.get(query);
    if (cached && now - cached.at < CACHE_MS) return cached.items;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:14d`)}&hl=fr&gl=FR&ceid=FR:fr`;
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } }).catch(() => null);
    // Actualités accessoires : en panne, la fiche s'affiche sans elles.
    if (!res?.ok) return [];
    const items = [...(await res.text()).matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .map(([, item]) => {
        const source = tag(item, 'source');
        const title = tag(item, 'title');
        return {
          // Google suffixe le titre par « - Source ».
          title: source && title.endsWith(` - ${source}`) ? title.slice(0, -source.length - 3) : title,
          url: tag(item, 'link'),
          source,
          sourceDomain: domain(item.match(/<source url="([^"]*)"/)?.[1]),
          publishedAt: new Date(tag(item, 'pubDate')),
        };
      })
      .filter((i) => i.url.startsWith('https://') && i.title && !Number.isNaN(i.publishedAt.getTime()))
      // Dépêche reprise par plusieurs sites : une seule fois.
      .filter((i, index, all) => all.findIndex((other) => other.title === i.title) === index)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, LIMIT);
    this.cache.set(query, { at: now, items });
    return items;
  }
}
