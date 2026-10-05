import { FindMarketSessionsService } from '@src/market/application/find-market-sessions.service.js';
import { FakeMarketData } from '@test/fakes/fake-market-data.js';

describe('FindMarketSessionsService', () => {
  it('gives the session of each Asian market, leaving out the unreachable ones', async () => {
    const market = new FakeMarketData();
    market.sessions.set('^BSESN', { start: new Date('2026-10-05T03:45:00Z'), end: new Date('2026-10-05T10:00:00Z'), lastSession: '2026-10-05' });
    expect(await new FindMarketSessionsService(market).execute()).toEqual([
      { key: 'hongKong', start: '2026-10-06T01:30:00.000Z', end: '2026-10-06T08:10:00.000Z', lastSession: '2026-10-05' },
      { key: 'mumbai', start: '2026-10-05T03:45:00.000Z', end: '2026-10-05T10:00:00.000Z', lastSession: '2026-10-05' },
    ]);
  });
});
