import type { Purchase } from './purchase.entity.js';

// Achat : ce qu'il a coûté, frais compris ; vente : ce qu'elle a rapporté, frais déduits.
export const purchaseTotal = ({ side, quantity, unitPrice, fees }: Pick<Purchase, 'side' | 'quantity' | 'unitPrice' | 'fees'>) =>
  side === 'buy' ? quantity * unitPrice + fees : quantity * unitPrice - fees;
