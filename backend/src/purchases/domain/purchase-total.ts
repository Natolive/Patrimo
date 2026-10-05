import type { Purchase } from './purchase.entity.js';

// Ce que l'achat a coûté : titres et frais.
export const purchaseTotal = ({ quantity, unitPrice, fees }: Pick<Purchase, 'quantity' | 'unitPrice' | 'fees'>) => quantity * unitPrice + fees;
