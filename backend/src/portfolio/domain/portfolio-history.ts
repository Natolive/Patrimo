import type { PortfolioPointDto } from '@pea/shared';
import type { PricePoint } from '../../market/domain/price-point.entity.js';
import { purchaseTotal } from '../../purchases/domain/purchase-total.js';
import type { Purchase } from '../../purchases/domain/purchase.entity.js';

// Valorisation et montant investi à chaque séance depuis le premier achat (achats triés par date).
// Valeur sans cours ce jour-là : dernière clôture connue, sinon le prix payé.
export function portfolioHistory(purchases: Purchase[], histories: Map<string, PricePoint[]>): PortfolioPointDto[] {
  if (!purchases.length) return [];
  const start = purchases[0].boughtAt;
  const byDate = new Map<string, [string, number][]>();
  for (const [symbol, points] of histories)
    for (const { date, close } of points) if (date >= start) byDate.set(date, [...(byDate.get(date) ?? []), [symbol, close]]);

  const lastClose = new Map<string, number>();
  return [...byDate.keys()].sort().map((date) => {
    for (const [symbol, close] of byDate.get(date)!) lastClose.set(symbol, close);
    const held = purchases.filter((p) => p.boughtAt <= date);
    return {
      date,
      value: held.reduce((sum, p) => sum + p.quantity * (lastClose.get(p.symbol) ?? p.unitPrice), 0),
      invested: held.reduce((sum, p) => sum + purchaseTotal(p), 0),
    };
  });
}
