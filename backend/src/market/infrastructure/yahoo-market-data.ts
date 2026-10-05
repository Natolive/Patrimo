import { Injectable } from '@nestjs/common';
import type { Instrument } from '../domain/instrument.entity.js';
import { MarketData } from '../domain/market-data.js';
import type { PricePoint } from '../domain/price-point.entity.js';
import type { TradingSession } from '../domain/trading-session.entity.js';
import { MarketUnavailableError } from '../domain/errors/market-unavailable.error.js';

const BASE = 'https://query2.finance.yahoo.com';
const CACHE_MS = 10 * 60 * 1000;
// Valeurs éligibles au PEA : actions et ETF ; Paris d'abord quand un ETF est coté sur plusieurs places.
const TYPES = ['EQUITY', 'ETF'];

interface SearchResponse {
  quotes?: { symbol: string; quoteType: string; exchange: string; longname?: string; shortname?: string }[];
}
interface ChartResponse {
  chart: {
    result: {
      meta: { currency: string; gmtoffset: number; currentTradingPeriod?: { regular: { start: number; end: number } } };
      timestamp?: number[];
      indicators: { quote: { close: (number | null)[] }[] };
    }[];
  };
}

// API publique non documentée de Yahoo Finance, sans clé.
// ponytail: cache en mémoire par processus (10 min) ; passer à un fournisseur officiel si Yahoo coupe ou limite l'accès.
@Injectable()
export class YahooMarketData extends MarketData {
  private readonly cache = new Map<string, { at: number; points: PricePoint[] }>();

  async search(query: string): Promise<Instrument | null> {
    const { quotes = [] } = await this.get<SearchResponse>(`/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`);
    const matches = quotes.filter((q) => TYPES.includes(q.quoteType));
    const quote = matches.find((q) => q.exchange === 'PAR') ?? matches[0];
    if (!quote) return null;
    const { currency } = (await this.chart(quote.symbol, '5d')).meta;
    return { symbol: quote.symbol, name: quote.longname ?? quote.shortname ?? quote.symbol, currency };
  }

  async history(symbol: string, now = Date.now()): Promise<PricePoint[]> {
    const cached = this.cache.get(symbol);
    if (cached && now - cached.at < CACHE_MS) return cached.points;
    const { meta, timestamp = [], indicators } = await this.chart(symbol, '5y');
    const closes = indicators.quote[0]?.close ?? [];
    const points = timestamp
      .map((t, i) => ({ date: new Date((t + meta.gmtoffset) * 1000).toISOString().slice(0, 10), close: closes[i] }))
      .filter((p): p is PricePoint => p.close != null);
    this.cache.set(symbol, { at: now, points });
    return points;
  }

  async session(symbol: string): Promise<TradingSession> {
    const { meta, timestamp = [] } = await this.chart(symbol, '5d');
    const regular = meta.currentTradingPeriod?.regular;
    if (!regular || !timestamp.length) throw new MarketUnavailableError();
    return {
      start: new Date(regular.start * 1000),
      end: new Date(regular.end * 1000),
      lastSession: new Date((timestamp.at(-1)! + meta.gmtoffset) * 1000).toISOString().slice(0, 10),
    };
  }

  private async chart(symbol: string, range: string) {
    const { chart } = await this.get<ChartResponse>(`/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`);
    return chart.result[0];
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, { headers: { 'user-agent': 'Mozilla/5.0' } }).catch(() => null);
    if (!res?.ok) throw new MarketUnavailableError();
    return (await res.json()) as T;
  }
}
