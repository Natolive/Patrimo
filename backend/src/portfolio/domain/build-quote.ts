import type { QuoteDto } from '@patrimo/shared';
import type { PricePoint } from '../../market/domain/price-point.entity.js';
import { analyzeTrend } from './analyze-trend.js';

// Dernier cours d'un historique non vide, comparé à la clôture précédente (elle-même faute d'historique).
export function buildQuote(points: PricePoint[]): QuoteDto & { previousClose: number } {
  const price = points.at(-1)!.close;
  const previousClose = points.at(-2)?.close ?? price;
  return { price, previousClose, dayChangeRate: price / previousClose - 1, trend: analyzeTrend(points) };
}
