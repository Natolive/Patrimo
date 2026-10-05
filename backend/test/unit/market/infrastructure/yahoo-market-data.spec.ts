import { MarketUnavailableError } from '@src/market/domain/errors/market-unavailable.error.js';
import { YahooMarketData } from '@src/market/infrastructure/yahoo-market-data.js';

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
    expect(await new YahooMarketData().search('CW8 & co')).toEqual({ symbol: 'CW8.PA', name: 'Amundi Paris', currency: 'EUR' });
    expect(fetch.mock.calls[0][0]).toContain('q=CW8%20%26%20co');
  });

  it('falls back to another place, then to the symbol as name', async () => {
    respond({ quotes: [{ symbol: 'ASML', quoteType: 'EQUITY', exchange: 'NMS' }] }, chart());
    expect(await new YahooMarketData().search('asml')).toMatchObject({ symbol: 'ASML', name: 'ASML' });
  });

  it('finds nothing', async () => {
    respond({ quotes: [] });
    expect(await new YahooMarketData().search('nope')).toBeNull();
    respond({});
    expect(await new YahooMarketData().search('nope')).toBeNull();
  });

  it('reads daily closes in the market time zone, skips empty ones and caches them', async () => {
    // 2026-01-05 23:00 UTC = 2026-01-06 01:00 à Paris (gmtoffset 7200).
    const fetch = respond(chart([1767654000, 1767740400, 1767826800], [10, null, 12]));
    const market = new YahooMarketData();
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
    const market = new YahooMarketData();
    await market.history('AI.PA', 0);
    expect(await market.history('AI.PA', 11 * 60 * 1000)).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(2);
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
    expect(await new YahooMarketData().session('^HSI')).toEqual({
      start: new Date('2026-10-06T01:30:00Z'),
      end: new Date('2026-10-06T08:10:00Z'),
      lastSession: '2026-10-05',
    });
  });

  it('reports a session without trading period or history as unavailable', async () => {
    respond(chart([1791163800], [1]));
    await expect(new YahooMarketData().session('^HSI')).rejects.toBeInstanceOf(MarketUnavailableError);
    respond({ chart: { result: [{ meta: { currency: 'HKD', gmtoffset: 0, currentTradingPeriod: { regular: { start: 1, end: 2 } } }, indicators: { quote: [] } }] } });
    await expect(new YahooMarketData().session('^HSI')).rejects.toBeInstanceOf(MarketUnavailableError);
  });

  it('reports the market as unavailable on an error or no network', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 429 })));
    await expect(new YahooMarketData().history('AI.PA')).rejects.toBeInstanceOf(MarketUnavailableError);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(new YahooMarketData().search('x')).rejects.toBeInstanceOf(MarketUnavailableError);
  });
});
