import type { PricePoint } from '@src/market/domain/price-point.entity.js';

// Une clôture par jour calendaire jusqu'à `end`, de valeurs données par `close(i)` (i = 0 pour la plus ancienne).
export function series(days: number, close: (i: number) => number, end = '2026-06-30'): PricePoint[] {
  const last = Date.parse(`${end}T00:00:00Z`);
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(last - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10),
    close: close(i),
  }));
}
