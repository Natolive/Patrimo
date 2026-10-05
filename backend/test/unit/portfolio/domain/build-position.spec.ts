import { buildPosition } from '@src/portfolio/domain/build-position.js';
import { bought } from './purchase.js';

describe('buildPosition', () => {
  it('adds up the purchases, fees included in the average cost', () => {
    const position = buildPosition(
      [bought({ quantity: 10, unitPrice: 100, fees: 5 }), bought({ quantity: 5, unitPrice: 130, fees: 5 })],
      [
        { date: '2026-01-02', close: 100 },
        { date: '2026-01-05', close: 125 },
      ],
    );
    expect(position).toMatchObject({ symbol: 'AI.PA', quantity: 15, invested: 1660, price: 125, value: 1875, gain: 215, dayChange: 375 });
    expect(position.averageCost).toBeCloseTo(110.667, 3);
    expect(position.gainRate).toBeCloseTo(1875 / 1660 - 1);
    expect(position.dayChangeRate).toBeCloseTo(0.25);
  });

  it('has no day change with a single close', () => {
    expect(buildPosition([bought({})], [{ date: '2026-01-02', close: 90 }])).toMatchObject({ dayChange: 0, dayChangeRate: 0, gain: -100 });
  });
});
