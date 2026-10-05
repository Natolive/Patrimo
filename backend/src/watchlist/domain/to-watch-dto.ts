import type { QuoteDto, WatchDto } from '@patrimo/shared';
import type { Watch } from './watch.entity.js';

export const toWatchDto = ({ id, symbol, name, currency }: Watch, quote: QuoteDto): WatchDto => ({
  id,
  symbol,
  name,
  currency,
  price: quote.price,
  dayChangeRate: quote.dayChangeRate,
  trend: quote.trend,
});
