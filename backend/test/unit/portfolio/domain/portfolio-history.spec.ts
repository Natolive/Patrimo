import { portfolioHistory } from '@src/portfolio/domain/portfolio-history.js';
import { bought } from './purchase.js';

describe('portfolioHistory', () => {
  it('values what is held each day, from the first purchase', () => {
    const histories = new Map([
      [
        'AI.PA',
        [
          { date: '2026-01-01', close: 90 },
          { date: '2026-01-02', close: 100 },
          { date: '2026-01-05', close: 110 },
        ],
      ],
      // Pas de cours le 2 : le prix payé en tient lieu ; pas de cours le 6 : dernière clôture gardée.
      ['CW8.PA', [{ date: '2026-01-05', close: 500 }]],
      ['MC.PA', [{ date: '2026-01-06', close: 700 }]],
    ]);
    const purchases = [
      bought({ boughtAt: '2026-01-02', quantity: 10, unitPrice: 100, fees: 1 }),
      bought({ symbol: 'CW8.PA', boughtAt: '2026-01-02', quantity: 1, unitPrice: 480, fees: 0 }),
      bought({ symbol: 'MC.PA', boughtAt: '2026-01-06', quantity: 1, unitPrice: 690, fees: 2 }),
    ];
    expect(portfolioHistory(purchases, histories)).toEqual([
      { date: '2026-01-02', value: 1480, invested: 1481 },
      { date: '2026-01-05', value: 1600, invested: 1481 },
      { date: '2026-01-06', value: 2300, invested: 2173 },
    ]);
  });

  it('drops what is sold at its average cost', () => {
    const histories = new Map([
      [
        'AI.PA',
        [
          { date: '2026-01-02', close: 100 },
          { date: '2026-01-05', close: 120 },
        ],
      ],
    ]);
    const trades = [bought({ quantity: 10, unitPrice: 100 }), bought({ side: 'sell', boughtAt: '2026-01-05', quantity: 4, unitPrice: 120 })];
    expect(portfolioHistory(trades, histories)).toEqual([
      { date: '2026-01-02', value: 1000, invested: 1000 },
      { date: '2026-01-05', value: 720, invested: 600 },
    ]);
  });

  it('leaves dividends out of the value, and their amount out of the prices', () => {
    // Pas de cours le 5 : le prix payé reste, pas les 2 € du dividende.
    const histories = new Map([['AI.PA', [{ date: '2026-01-02', close: 100 }, { date: '2026-01-06', close: 110 }]], ['MC.PA', [{ date: '2026-01-05', close: 700 }]]]);
    const trades = [bought({ quantity: 10, unitPrice: 100 }), bought({ side: 'dividend', boughtAt: '2026-01-05', quantity: 10, unitPrice: 2 })];
    expect(portfolioHistory(trades, histories)).toEqual([
      { date: '2026-01-02', value: 1000, invested: 1000 },
      { date: '2026-01-05', value: 1000, invested: 1000 },
      { date: '2026-01-06', value: 1100, invested: 1000 },
    ]);
  });

  it('is empty without purchases', () => {
    expect(portfolioHistory([], new Map())).toEqual([]);
  });
});
