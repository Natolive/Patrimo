import type { PricePoint } from './price-point.entity.js';
import type { PriceTick } from './price-tick.entity.js';

// Dernière cotation en direct appliquée à l'historique : elle remplace la clôture de sa séance, ou ouvre la séance suivante ;
// plus ancienne que l'historique, elle est ignorée. `offset` : décalage de la place sur UTC (secondes), pour dater la séance.
export function withLivePrice(points: PricePoint[], tick: PriceTick | undefined, offset: number): PricePoint[] {
  if (!tick) return points;
  const date = new Date(tick.time.getTime() + offset * 1000).toISOString().slice(0, 10);
  const last = points.at(-1);
  if (last && date < last.date) return points;
  return [...(last?.date === date ? points.slice(0, -1) : points), { date, close: tick.price }];
}
