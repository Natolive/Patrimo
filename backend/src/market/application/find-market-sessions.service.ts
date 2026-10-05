import { Injectable } from '@nestjs/common';
import { ASIAN_MARKETS, type MarketSessionDto } from '@pea/shared';
import { MarketData } from '../domain/market-data.js';

// Séances des places asiatiques ; une place injoignable est simplement omise.
@Injectable()
export class FindMarketSessionsService {
  constructor(private readonly market: MarketData) {}

  async execute(): Promise<MarketSessionDto[]> {
    const results = await Promise.allSettled(ASIAN_MARKETS.map((m) => this.market.session(m.symbol)));
    return ASIAN_MARKETS.flatMap((m, i) => {
      const result = results[i];
      if (result.status === 'rejected') return [];
      const { start, end, lastSession } = result.value;
      return [{ key: m.key, start: start.toISOString(), end: end.toISOString(), lastSession }];
    });
  }
}
