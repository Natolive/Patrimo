import type { Purchase } from './purchase.entity.js';

export type NewPurchase = Omit<Purchase, 'id' | 'createdAt'>;
