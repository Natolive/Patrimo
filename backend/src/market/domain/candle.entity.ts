// Bougie : `time` en secondes, heure de la place comptée comme UTC (minuit pour une séance entière).
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Bougies d'une période, avec le décalage de la place sur UTC (secondes) pour y placer une cotation en direct.
export interface CandleSeries {
  offset: number;
  candles: Candle[];
}
