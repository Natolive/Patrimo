import { analyzeTrend } from '@src/portfolio/domain/analyze-trend.js';
import { series } from './series.js';

describe('analyzeTrend', () => {
  it('reads a steady rise as an up trend', () => {
    // 100 au 1er juillet 2025, +1 par jour jusqu'au 30 juin 2026.
    const trend = analyzeTrend(series(365, (i) => 100 + i));
    expect(trend.signal).toBe('up');
    expect(trend.performance['1m']).toBeCloseTo(464 / 434 - 1);
    expect(trend.performance.ytd).toBeCloseTo(464 / 283 - 1);
    expect(trend.performance['1y']).toBeNull();
    expect(trend.sma50).toBeCloseTo(439.5);
    expect(trend.sma200).toBeCloseTo(364.5);
    expect(trend).toMatchObject({ high52: 464, low52: 100, fromHigh52: 0 });
    expect(trend.volatility).toBeGreaterThan(0);
  });

  it('reads a steady fall as a down trend, from its 52-week high', () => {
    const trend = analyzeTrend(series(400, (i) => 1000 - i));
    expect(trend.signal).toBe('down');
    expect(trend.performance['1y']).toBeCloseTo(601 / 966 - 1);
    expect(trend.high52).toBe(965);
    expect(trend.fromHigh52).toBeCloseTo(601 / 965 - 1);
  });

  it('is neutral when the price and the 50-day average disagree', () => {
    // Longue hausse puis chute brutale : cours sous la MM200, MM50 encore au-dessus.
    expect(analyzeTrend(series(300, (i) => (i < 290 ? 100 + i : 50))).signal).toBe('neutral');
  });

  it('leaves out what a short history cannot tell', () => {
    const trend = analyzeTrend(series(10, () => 50));
    expect(trend).toMatchObject({ sma50: null, sma200: null, signal: null, volatility: null, high52: 50, low52: 50 });
    expect(trend.performance['1m']).toBeNull();
  });
});
