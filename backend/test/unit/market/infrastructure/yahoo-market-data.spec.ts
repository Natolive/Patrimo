import { MarketUnavailableError } from '@src/market/domain/errors/market-unavailable.error.js';
import { YahooMarketData } from '@src/market/infrastructure/yahoo-market-data.js';
import { FakePriceStream } from '@test/fakes/fake-price-stream.js';

// Réponses de Yahoo rejouées : le format réel est vérifié à la main (voir le README).
const chart = (timestamp?: number[], close: (number | null)[] = []) => ({
  chart: { result: [{ meta: { currency: 'EUR', gmtoffset: 7200 }, timestamp, indicators: { quote: [{ close }] } }] },
});
const respond = (...bodies: unknown[]) => {
  const fetch = vi.fn();
  for (const body of bodies) fetch.mockResolvedValueOnce(new Response(JSON.stringify(body)));
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

describe('YahooMarketData', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('prefers a Paris listing among stocks and ETFs, and reads its currency', async () => {
    const fetch = respond(
      {
        quotes: [
          { symbol: 'XX', quoteType: 'MUTUALFUND', exchange: 'PAR' },
          { symbol: 'CW8U.L', quoteType: 'ETF', exchange: 'LSE', longname: 'Amundi London' },
          { symbol: 'CW8.PA', quoteType: 'ETF', exchange: 'PAR', shortname: 'Amundi Paris' },
        ],
      },
      chart(),
    );
    expect(await new YahooMarketData(new FakePriceStream()).search('CW8 & co')).toEqual({ symbol: 'CW8.PA', name: 'Amundi Paris', currency: 'EUR' });
    expect(fetch.mock.calls[0][0]).toContain('q=CW8%20%26%20co');
  });

  it('takes the exact symbol chosen in the search over the Paris listing', async () => {
    respond(
      {
        quotes: [
          { symbol: 'ASML.PA', quoteType: 'EQUITY', exchange: 'PAR' },
          { symbol: 'ASML.AS', quoteType: 'EQUITY', exchange: 'AMS', longname: 'ASML Holding N.V.' },
        ],
      },
      chart(),
    );
    expect(await new YahooMarketData(new FakePriceStream()).search(' asml.as ')).toMatchObject({ symbol: 'ASML.AS', name: 'ASML Holding N.V.' });
  });

  it('suggests stocks and ETFs with their place and type', async () => {
    respond({
      quotes: [
        { symbol: 'CW8.PA', quoteType: 'ETF', exchange: 'PAR', exchDisp: 'Paris', longname: 'Amundi MSCI World' },
        { symbol: 'AI.PA', quoteType: 'EQUITY', exchange: 'PAR', shortname: 'AIR LIQUIDE' },
        { symbol: 'XX', quoteType: 'MUTUALFUND', exchange: 'PAR' },
        { symbol: 'ABC', quoteType: 'EQUITY', exchange: 'NMS' },
      ],
    });
    expect(await new YahooMarketData(new FakePriceStream()).suggest('a')).toEqual([
      { symbol: 'CW8.PA', name: 'Amundi MSCI World', exchange: 'Paris', type: 'etf' },
      { symbol: 'AI.PA', name: 'AIR LIQUIDE', exchange: 'PAR', type: 'equity' },
      { symbol: 'ABC', name: 'ABC', exchange: 'NMS', type: 'equity' },
    ]);
    respond({});
    expect(await new YahooMarketData(new FakePriceStream()).suggest('zzz')).toEqual([]);
  });

  it('falls back to another place, then to the symbol as name', async () => {
    respond({ quotes: [{ symbol: 'ASML', quoteType: 'EQUITY', exchange: 'NMS' }] }, chart());
    expect(await new YahooMarketData(new FakePriceStream()).search('asml')).toMatchObject({ symbol: 'ASML', name: 'ASML' });
  });

  it('finds nothing', async () => {
    respond({ quotes: [] });
    expect(await new YahooMarketData(new FakePriceStream()).search('nope')).toBeNull();
    respond({});
    expect(await new YahooMarketData(new FakePriceStream()).search('nope')).toBeNull();
  });

  it('reads daily closes in the market time zone, skips empty ones and caches them', async () => {
    // 2026-01-05 23:00 UTC = 2026-01-06 01:00 à Paris (gmtoffset 7200).
    const fetch = respond(chart([1767654000, 1767740400, 1767826800], [10, null, 12]));
    const market = new YahooMarketData(new FakePriceStream());
    const points = [
      { date: '2026-01-06', close: 10 },
      { date: '2026-01-08', close: 12 },
    ];
    expect(await market.history('AI.PA', 0)).toEqual(points);
    expect(await market.history('AI.PA', 1000)).toEqual(points);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('refetches once the cache is stale, and reads an empty answer', async () => {
    const fetch = respond(chart([1767654000], [10]), { chart: { result: [{ meta: { currency: 'EUR', gmtoffset: 0 }, indicators: { quote: [] } }] } });
    const market = new YahooMarketData(new FakePriceStream());
    await market.history('AI.PA', 0);
    expect(await market.history('AI.PA', 11 * 60 * 1000)).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('takes the live price of a streamed value as the close of its session', async () => {
    respond(chart([1767654000, 1767740400], [10, 11]));
    const stream = new FakePriceStream();
    // 2026-01-07 00:30 UTC = 2026-01-07 à Paris (gmtoffset 7200) : même séance que le dernier point.
    stream.emit({ symbol: 'AI.PA', price: 11.5, time: new Date('2026-01-07T00:30:00Z'), change: 0, changeRate: 0, dayVolume: 0 });
    expect((await new YahooMarketData(stream).history('AI.PA', 0)).at(-1)).toEqual({ date: '2026-01-07', close: 11.5 });
  });

  it('reads intraday candles in the market time zone and skips incomplete ones', async () => {
    const fetch = respond({
      chart: {
        result: [
          {
            meta: { currency: 'EUR', gmtoffset: 7200 },
            timestamp: [1791356400, 1791356700, 1791357000],
            indicators: { quote: [{ open: [169, null, 168.9], high: [169.4, 169.1, 169.1], low: [168.8, 168.7, 168.8], close: [169, 169.1, 168.9], volume: [2652, 2511, null] }] },
          },
        ],
      },
    });
    expect(await new YahooMarketData(new FakePriceStream()).candles('AI.PA', '1d')).toEqual({
      offset: 7200,
      candles: [
        { time: 1791356400 + 7200, open: 169, high: 169.4, low: 168.8, close: 169, volume: 2652 },
        { time: 1791357000 + 7200, open: 168.9, high: 169.1, low: 168.8, close: 168.9, volume: 0 },
      ],
    });
    expect(fetch.mock.calls[0][0]).toContain('range=1d&interval=5m');
  });

  it('puts daily candles at midnight of their session, and reads an empty answer', async () => {
    // 2026-10-07 07:00 UTC = 9 h à Paris.
    respond({ chart: { result: [{ meta: { currency: 'EUR', gmtoffset: 7200 }, timestamp: [1791356400], indicators: { quote: [{ open: [1], high: [2], low: [0.5], close: [1.5], volume: [10] }] } }] } });
    expect((await new YahooMarketData(new FakePriceStream()).candles('AI.PA', '5y')).candles).toEqual([
      { time: Date.parse('2026-10-07') / 1000, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
    ]);
    respond({ chart: { result: [{ meta: { currency: 'EUR', gmtoffset: 0 }, indicators: { quote: [] } }] } });
    expect(await new YahooMarketData(new FakePriceStream()).candles('AI.PA', '1mo')).toEqual({ offset: 0, candles: [] });
  });

  it('reads the current or next session of a market and its last trading day', async () => {
    respond({
      chart: {
        result: [
          {
            meta: { currency: 'HKD', gmtoffset: 28800, currentTradingPeriod: { regular: { start: 1791250200, end: 1791274200 } } },
            // Dernière séance : lundi 5 octobre à Hong Kong.
            timestamp: [1791163800],
            indicators: { quote: [{ close: [26000] }] },
          },
        ],
      },
    });
    expect(await new YahooMarketData(new FakePriceStream()).session('^HSI')).toEqual({
      start: new Date('2026-10-06T01:30:00Z'),
      end: new Date('2026-10-06T08:10:00Z'),
      lastSession: '2026-10-05',
    });
  });

  it('reports a session without trading period or history as unavailable', async () => {
    respond(chart([1791163800], [1]));
    await expect(new YahooMarketData(new FakePriceStream()).session('^HSI')).rejects.toBeInstanceOf(MarketUnavailableError);
    respond({ chart: { result: [{ meta: { currency: 'HKD', gmtoffset: 0, currentTradingPeriod: { regular: { start: 1, end: 2 } } }, indicators: { quote: [] } }] } });
    await expect(new YahooMarketData(new FakePriceStream()).session('^HSI')).rejects.toBeInstanceOf(MarketUnavailableError);
  });

  it('reports the market as unavailable on an error or no network', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 429 })));
    await expect(new YahooMarketData(new FakePriceStream()).history('AI.PA')).rejects.toBeInstanceOf(MarketUnavailableError);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(new YahooMarketData(new FakePriceStream()).search('x')).rejects.toBeInstanceOf(MarketUnavailableError);
  });
});
