import type { Purchase } from '@src/purchases/domain/purchase.entity.js';

export const bought = (data: Partial<Purchase>): Purchase => ({
  id: '1',
  side: 'buy',
  userId: 'lea',
  symbol: 'AI.PA',
  name: 'Air Liquide',
  currency: 'EUR',
  boughtAt: '2026-01-02',
  quantity: 10,
  unitPrice: 100,
  fees: 0,
  createdAt: new Date(),
  ...data,
});
