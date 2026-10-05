import { Injectable } from '@nestjs/common';
import type { LastPriceDto } from '@patrimo/shared';
import { MarketData } from '../domain/market-data.js';
import { MarketUnavailableError } from '../domain/errors/market-unavailable.error.js';

// Dernière clôture connue (cours du jour pendant la séance), pour préremplir le prix d'un ordre.
@Injectable()
export class FindLastPriceService {
  constructor(private readonly market: MarketData) {}

  async execute(symbol: string): Promise<LastPriceDto> {
    const last = (await this.market.history(symbol)).at(-1);
    if (!last) throw new MarketUnavailableError();
    return { symbol, price: last.close, date: last.date };
  }
}
