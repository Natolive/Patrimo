import { Injectable } from '@nestjs/common';
import type { CandlesDto, CandlesQueryDto } from '@patrimo/shared';
import { MarketData } from '../domain/market-data.js';

// Bougies d'une valeur pour le graphique de sa fiche.
@Injectable()
export class FindCandlesService {
  constructor(private readonly market: MarketData) {}

  execute(symbol: string, { range }: CandlesQueryDto): Promise<CandlesDto> {
    return this.market.candles(symbol, range);
  }
}
