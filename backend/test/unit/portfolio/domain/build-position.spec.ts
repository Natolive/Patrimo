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
    expect(position).toMatchObject({ symbol: 'AI.PA', quantity: 15, invested: 1660, price: 125, value: 1875, gain: 215, dayChange: 375, realizedGain: 0 });
    expect(position.averageCost).toBeCloseTo(110.667, 3);
    expect(position.gainRate).toBeCloseTo(1875 / 1660 - 1);
    expect(position.dayChangeRate).toBeCloseTo(0.25);
  });

  it('has no day change with a single close', () => {
    expect(buildPosition([bought({})], [{ date: '2026-01-02', close: 90 }])).toMatchObject({ dayChange: 0, dayChangeRate: 0, gain: -100 });
  });

  it('values what is left after a sale, at the same average cost', () => {
    const position = buildPosition(
      [bought({ side: 'sell', boughtAt: '2026-01-05', quantity: 4, unitPrice: 120, fees: 0 }), bought({ quantity: 10, unitPrice: 100, fees: 0 })],
      [{ date: '2026-01-05', close: 125 }],
    );
    expect(position).toMatchObject({ quantity: 6, invested: 600, averageCost: 100, value: 750, gain: 150, realizedGain: 80 });
  });

  it('keeps only the realized gain of a closed line', () => {
    const position = buildPosition(
      [bought({ quantity: 3, unitPrice: 100 }), bought({ side: 'sell', boughtAt: '2026-01-05', quantity: 3, unitPrice: 90, fees: 1 })],
      [{ date: '2026-01-05', close: 95 }],
    );
    expect(position).toMatchObject({ quantity: 0, invested: 0, averageCost: 0, value: 0, gain: 0, gainRate: 0, dayChange: 0, realizedGain: -31 });
  });
});
