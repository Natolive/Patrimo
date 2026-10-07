// Cotation reçue en direct ; `changeRate` : 0,0123 = +1,23 % sur la séance.
export interface PriceTick {
  symbol: string;
  price: number;
  time: Date;
  change: number;
  changeRate: number;
  dayVolume: number;
}
