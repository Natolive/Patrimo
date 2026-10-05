export interface Purchase {
  id: string;
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
