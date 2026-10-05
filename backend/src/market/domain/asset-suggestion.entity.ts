export interface AssetSuggestion {
  symbol: string;
  name: string;
  exchange: string;
  type: 'equity' | 'etf';
}
