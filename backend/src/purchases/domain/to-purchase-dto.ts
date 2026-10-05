import type { PurchaseDto } from '@pea/shared';
import { purchaseTotal } from './purchase-total.js';
import type { Purchase } from './purchase.entity.js';

export const toPurchaseDto = (p: Purchase): PurchaseDto => ({
  id: p.id,
  side: p.side,
  symbol: p.symbol,
  name: p.name,
  currency: p.currency,
  boughtAt: p.boughtAt,
  quantity: p.quantity,
  unitPrice: p.unitPrice,
  fees: p.fees,
  total: purchaseTotal(p),
});
