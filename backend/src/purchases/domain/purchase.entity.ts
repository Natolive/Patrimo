import type { TradeSide } from '@pea/shared';

// Opération (achat ou vente) ; le nom date de la version sans ventes.
export interface Purchase {
  id: string;
  side: TradeSide;
  userId: string;
  // Valeur retrouvée à la saisie, gardée telle quelle (nom affiché même si le fournisseur de cours change).
  symbol: string;
  name: string;
  currency: string;
  boughtAt: string;
  quantity: number;
  unitPrice: number;
  fees: number;
  createdAt: Date;
}
