import type { PositionDto } from '@patrimo/shared';
import type { PricePoint } from '../../market/domain/price-point.entity.js';
import type { Purchase } from '../../purchases/domain/purchase.entity.js';
import { buildQuote } from './build-quote.js';
import { applyTrade, chronological, emptyHolding } from './holding.js';

// Ligne du portefeuille à partir des opérations d'une même valeur et de son historique (non vide) ;
// quantité nulle = ligne soldée (gardée pour sa plus-value réalisée) ; le poids se calcule sur l'ensemble.
export function buildPosition(trades: Purchase[], points: PricePoint[]): Omit<PositionDto, 'weight'> {
  const { symbol, name, currency } = trades[0];
  const { quantity, cost, realizedGain, dividends } = chronological(trades).reduce(applyTrade, emptyHolding());
  const { previousClose, ...quote } = buildQuote(points);
  const value = quantity * quote.price;
  return {
    symbol,
    name,
    currency,
    quantity,
    invested: cost,
    averageCost: quantity ? cost / quantity : 0,
    ...quote,
    value,
    gain: value - cost,
    gainRate: cost ? value / cost - 1 : 0,
    dayChange: quantity * (quote.price - previousClose),
    realizedGain,
    dividends,
  };
}
