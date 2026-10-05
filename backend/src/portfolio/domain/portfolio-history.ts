import type { PortfolioPointDto } from '@patrimo/shared';
import type { PricePoint } from '../../market/domain/price-point.entity.js';
import type { Purchase } from '../../purchases/domain/purchase.entity.js';
import { applyTrade, chronological, emptyHolding, type Holding } from './holding.js';

// Valorisation et coût des titres détenus à chaque séance depuis la première opération.
// Valeur sans cours ce jour-là : dernière clôture connue, sinon le prix de la dernière opération.
export function portfolioHistory(trades: Purchase[], histories: Map<string, PricePoint[]>): PortfolioPointDto[] {
  const ordered = chronological(trades);
  if (!ordered.length) return [];
  const start = ordered[0].boughtAt;
  const byDate = new Map<string, [string, number][]>();
  for (const [symbol, points] of histories)
    for (const { date, close } of points) if (date >= start) byDate.set(date, [...(byDate.get(date) ?? []), [symbol, close]]);

  const holdings = new Map<string, Holding>();
  const lastPrice = new Map<string, number>();
  let next = 0;
  return [...byDate.keys()].sort().map((date) => {
    for (; next < ordered.length && ordered[next].boughtAt <= date; next++) {
      const trade = ordered[next];
      holdings.set(trade.symbol, applyTrade(holdings.get(trade.symbol) ?? emptyHolding(), trade));
      lastPrice.set(trade.symbol, trade.unitPrice);
    }
    for (const [symbol, close] of byDate.get(date)!) lastPrice.set(symbol, close);
    let value = 0;
    let invested = 0;
    for (const [symbol, h] of holdings) {
      value += h.quantity * lastPrice.get(symbol)!;
      invested += h.cost;
    }
    return { date, value, invested };
  });
}
