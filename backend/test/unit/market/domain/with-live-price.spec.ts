import { withLivePrice } from '@src/market/domain/with-live-price.js';

const points = [
  { date: '2026-01-06', close: 10 },
  { date: '2026-01-07', close: 11 },
];
const tick = (time: string, price: number) => ({
  symbol: 'AI.PA',
  price,
  time: new Date(time),
  change: 0,
  changeRate: 0,
  dayVolume: 0,
});

describe('withLivePrice', () => {
  it('keeps the history without live price', () => {
    expect(withLivePrice(points, undefined, 0)).toBe(points);
  });

  it('replaces the close of the same session, dated in the market time zone', () => {
    // 2026-01-06 23:30 UTC = 2026-01-07 à Paris (offset 7200).
    expect(withLivePrice(points, tick('2026-01-06T23:30:00Z', 11.5), 7200)).toEqual([points[0], { date: '2026-01-07', close: 11.5 }]);
  });

  it('opens the next session, even without history', () => {
    expect(withLivePrice(points, tick('2026-01-08T09:00:00Z', 12), 0).at(-1)).toEqual({ date: '2026-01-08', close: 12 });
    expect(withLivePrice([], tick('2026-01-08T09:00:00Z', 12), 0)).toEqual([{ date: '2026-01-08', close: 12 }]);
  });

  it('ignores a tick older than the history', () => {
    expect(withLivePrice(points, tick('2026-01-01T09:00:00Z', 1), 0)).toBe(points);
  });
});
