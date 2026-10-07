import { Injectable } from '@nestjs/common';
import type { CandleRange } from '@patrimo/shared';
import type { AssetSuggestion } from '../domain/asset-suggestion.entity.js';
import type { CandleSeries } from '../domain/candle.entity.js';
import type { Instrument } from '../domain/instrument.entity.js';
import { MarketData } from '../domain/market-data.js';
import { PriceStream } from '../domain/price-stream.js';
import { withLivePrice } from '../domain/with-live-price.js';
import type { PricePoint } from '../domain/price-point.entity.js';
import type { TradingSession } from '../domain/trading-session.entity.js';
import { MarketUnavailableError } from '../domain/errors/market-unavailable.error.js';

const BASE = 'https://query2.finance.yahoo.com';
const CACHE_MS = 10 * 60 * 1000;
// Actions et ETF seulement ; symbole exact d'abord (valeur choisie dans la recherche), sinon Paris quand elle est cotée sur plusieurs places.
const TYPES = ['EQUITY', 'ETF'];
// Intervalle des bougies selon la période.
const INTERVALS: Record<CandleRange, string> = { '1d': '5m', '5d': '15m', '1mo': '60m', '5y': '1d' };
const DAY = 86_400;

interface SearchResponse {
  quotes?: { symbol: string; quoteType: string; exchange: string; exchDisp?: string; longname?: string; shortname?: string }[];
}
interface ChartResponse {
  chart: {
    result: {
      meta: { currency: string; gmtoffset: number; currentTradingPeriod?: { regular: { start: number; end: number } } };
      timestamp?: number[];
      indicators: {
        quote: { close: (number | null)[]; open?: (number | null)[]; high?: (number | null)[]; low?: (number | null)[]; volume?: (number | null)[] }[];
      };
    }[];
  };
}

// Date AAAA-MM-JJ à l'heure de la place, pour un instant en secondes.
const localDate = (seconds: number, offset: number) => new Date((seconds + offset) * 1000).toISOString().slice(0, 10);

// API publique non documentée de Yahoo Finance, sans clé.
// ponytail: cache en mémoire par processus (10 min, le cours du jour vient du flux direct) ; passer à un fournisseur officiel si Yahoo coupe ou limite l'accès.
@Injectable()
export class YahooMarketData extends MarketData {
  private readonly cache = new Map<string, { at: number; offset: number; points: PricePoint[] }>();

  constructor(private readonly stream: PriceStream) {
    super();
  }

  async search(query: string): Promise<Instrument | null> {
    const { quotes = [] } = await this.get<SearchResponse>(`/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`);
    const matches = quotes.filter((q) => TYPES.includes(q.quoteType));
    const quote = matches.find((q) => q.symbol.toUpperCase() === query.trim().toUpperCase()) ?? matches.find((q) => q.exchange === 'PAR') ?? matches[0];
    if (!quote) return null;
    const { currency } = (await this.chart(quote.symbol, '5d')).meta;
    return { symbol: quote.symbol, name: quote.longname ?? quote.shortname ?? quote.symbol, currency };
  }

  async suggest(query: string): Promise<AssetSuggestion[]> {
    const { quotes = [] } = await this.get<SearchResponse>(`/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`);
    return quotes
      .filter((q) => TYPES.includes(q.quoteType))
      .map((q) => ({
        symbol: q.symbol,
        name: q.longname ?? q.shortname ?? q.symbol,
        exchange: q.exchDisp ?? q.exchange,
        type: q.quoteType === 'ETF' ? 'etf' : 'equity',
      }));
  }

  async history(symbol: string, now = Date.now()): Promise<PricePoint[]> {
    let cached = this.cache.get(symbol);
    if (!cached || now - cached.at >= CACHE_MS) {
      const { meta, timestamp = [], indicators } = await this.chart(symbol, '5y');
      const closes = indicators.quote[0]?.close ?? [];
      const points = timestamp.map((t, i) => ({ date: localDate(t, meta.gmtoffset), close: closes[i] })).filter((p): p is PricePoint => p.close != null);
      cached = { at: now, offset: meta.gmtoffset, points };
      this.cache.set(symbol, cached);
    }
    return withLivePrice(cached.points, this.stream.last(symbol), cached.offset);
  }

  // Pas de cache : chargées à l'ouverture de la fiche ou au changement de période, le direct passe ensuite par le flux.
  async candles(symbol: string, range: CandleRange): Promise<CandleSeries> {
    const interval = INTERVALS[range];
    const { meta, timestamp = [], indicators } = await this.chart(symbol, range, interval);
    const { open = [], high = [], low = [], close, volume = [] } = indicators.quote[0] ?? { close: [] };
    const candles = timestamp.flatMap((t, i) => {
      const local = t + meta.gmtoffset;
      const [o, h, l, c] = [open[i], high[i], low[i], close[i]];
      if (o == null || h == null || l == null || c == null) return [];
      return [{ time: interval === '1d' ? local - (local % DAY) : local, open: o, high: h, low: l, close: c, volume: volume[i] ?? 0 }];
    });
    return { offset: meta.gmtoffset, candles };
  }

  async session(symbol: string): Promise<TradingSession> {
    const { meta, timestamp = [] } = await this.chart(symbol, '5d');
    const regular = meta.currentTradingPeriod?.regular;
    if (!regular || !timestamp.length) throw new MarketUnavailableError();
    return {
      start: new Date(regular.start * 1000),
      end: new Date(regular.end * 1000),
      lastSession: localDate(timestamp.at(-1)!, meta.gmtoffset),
    };
  }

  private async chart(symbol: string, range: string, interval = '1d') {
    const { chart } = await this.get<ChartResponse>(`/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`);
    return chart.result[0];
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, { headers: { 'user-agent': 'Mozilla/5.0' } }).catch(() => null);
    if (!res?.ok) throw new MarketUnavailableError();
    return (await res.json()) as T;
  }
}
