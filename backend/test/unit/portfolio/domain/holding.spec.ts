import { applyTrade, chronological, emptyHolding, findOversold } from '@src/portfolio/domain/holding.js';
import { bought } from './purchase.js';

describe('holding', () => {
  it('keeps the average cost on a sale and books the realized gain', () => {
    const afterBuys = [bought({ quantity: 10, unitPrice: 100, fees: 5 }), bought({ quantity: 10, unitPrice: 120, fees: 5 })].reduce(applyTrade, emptyHolding());
    expect(afterBuys).toEqual({ quantity: 20, cost: 2210, realizedGain: 0 });
    // PRU 110,50 : vendre 5 à 130 avec 2 € de frais rapporte 5 × 130 − 2 − 5 × 110,50.
    const afterSale = applyTrade(afterBuys, bought({ side: 'sell', quantity: 5, unitPrice: 130, fees: 2 }));
    expect(afterSale.quantity).toBe(15);
    expect(afterSale.cost).toBeCloseTo(1657.5);
    expect(afterSale.realizedGain).toBeCloseTo(95.5);
  });

  it('closes the line when everything is sold, despite rounding', () => {
    const holding = [bought({ quantity: 0.1, unitPrice: 10 }), bought({ quantity: 0.2, unitPrice: 10 }), bought({ side: 'sell', quantity: 0.3, unitPrice: 11 })].reduce(
      applyTrade,
      emptyHolding(),
    );
    expect(holding.quantity).toBe(0);
    expect(holding.cost).toBe(0);
    expect(holding.realizedGain).toBeCloseTo(0.3);
  });

  it('books a sale without shares as a pure gain (never saved: refused before)', () => {
    expect(applyTrade(emptyHolding(), bought({ side: 'sell', quantity: 1, unitPrice: 10 }))).toEqual({ quantity: -1, cost: 0, realizedGain: 10 });
  });

  it('orders by date, buys before sales the same day, then by entry', () => {
    const sale = bought({ id: 'sale', side: 'sell', boughtAt: '2026-01-02' });
    const buy = bought({ id: 'buy', boughtAt: '2026-01-02' });
    const early = bought({ id: 'early', boughtAt: '2026-01-01' });
    const first = bought({ id: 'first', boughtAt: '2026-01-03', createdAt: new Date(1) });
    const second = bought({ id: 'second', boughtAt: '2026-01-03', createdAt: new Date(2) });
    expect(chronological([second, sale, first, buy, early]).map((t) => t.id)).toEqual(['early', 'buy', 'sale', 'first', 'second']);
  });

  it('finds the first sale of more shares than held, per value', () => {
    const lvmh = bought({ symbol: 'MC.PA', quantity: 1 });
    const sale = bought({ id: 'oversold', side: 'sell', boughtAt: '2026-01-05', quantity: 11 });
    expect(findOversold([bought({}), lvmh, sale])).toBe(sale);
    expect(findOversold([bought({}), lvmh, { ...sale, quantity: 10 }])).toBeNull();
  });
});
