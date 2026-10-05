// Valeur cotée, identifiée par son symbole chez le fournisseur de cours (ex. `AI.PA`).
export interface Instrument {
  symbol: string;
  name: string;
  currency: string;
}
