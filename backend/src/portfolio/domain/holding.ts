import type { Purchase } from '../../purchases/domain/purchase.entity.js';

// Titres détenus d'une valeur après une suite d'opérations, au prix moyen pondéré (méthode du PRU des PEA) :
// un achat ajoute son coût frais compris ; une vente sort sa part du coût au PRU, la différence est la plus-value réalisée ;
// un dividende ne touche ni la quantité ni le PRU, il s'ajoute aux dividendes encaissés.
export interface Holding {
  quantity: number;
  cost: number;
  realizedGain: number;
  dividends: number;
}

// Sous ce seuil, la ligne est soldée (arrondis des fractions de titres).
const EPSILON = 1e-9;

export const emptyHolding = (): Holding => ({ quantity: 0, cost: 0, realizedGain: 0, dividends: 0 });

export function applyTrade(holding: Holding, trade: Purchase): Holding {
  if (trade.side === 'dividend') return { ...holding, dividends: holding.dividends + trade.quantity * trade.unitPrice - trade.fees };
  if (trade.side === 'buy')
    return { ...holding, quantity: holding.quantity + trade.quantity, cost: holding.cost + trade.quantity * trade.unitPrice + trade.fees };
  const costOut = holding.quantity > EPSILON ? (holding.cost / holding.quantity) * trade.quantity : 0;
  const quantity = holding.quantity - trade.quantity;
  const closed = Math.abs(quantity) < EPSILON;
  return {
    quantity: closed ? 0 : quantity,
    cost: closed ? 0 : holding.cost - costOut,
    realizedGain: holding.realizedGain + trade.quantity * trade.unitPrice - trade.fees - costOut,
    dividends: holding.dividends,
  };
}

// Ordre d'application : par date, achats puis ventes puis dividendes le même jour, puis par saisie.
const SIDE_ORDER = { buy: 0, sell: 1, dividend: 2 };
export const chronological = (trades: Purchase[]) =>
  trades.toSorted((a, b) => a.boughtAt.localeCompare(b.boughtAt) || SIDE_ORDER[a.side] - SIDE_ORDER[b.side] || a.createdAt.getTime() - b.createdAt.getTime());

// Première vente de plus de titres que détenus à sa date, sinon null.
export function findOversold(trades: Purchase[]): Purchase | null {
  const holdings = new Map<string, Holding>();
  for (const trade of chronological(trades)) {
    const holding = applyTrade(holdings.get(trade.symbol) ?? emptyHolding(), trade);
    if (holding.quantity < -EPSILON) return trade;
    holdings.set(trade.symbol, holding);
  }
  return null;
}
