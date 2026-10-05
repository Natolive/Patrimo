import type { PositionDto } from '@pea/shared';
import type { PricePoint } from '../../market/domain/price-point.entity.js';
import { purchaseTotal } from '../../purchases/domain/purchase-total.js';
import type { Purchase } from '../../purchases/domain/purchase.entity.js';
import { buildQuote } from './build-quote.js';

// Ligne du portefeuille à partir des achats d'une même valeur et de son historique (non vide) ; le poids se calcule sur l'ensemble.
export function buildPosition(purchases: Purchase[], points: PricePoint[]): Omit<PositionDto, 'weight'> {
  const { symbol, name, currency } = purchases[0];
  const quantity = purchases.reduce((sum, p) => sum + p.quantity, 0);
  const invested = purchases.reduce((sum, p) => sum + purchaseTotal(p), 0);
  const { previousClose, ...quote } = buildQuote(points);
  const value = quantity * quote.price;
  return {
    symbol,
    name,
    currency,
    quantity,
    invested,
    averageCost: invested / quantity,
    ...quote,
    value,
    gain: value - invested,
    gainRate: value / invested - 1,
    dayChange: quantity * (quote.price - previousClose),
  };
}
