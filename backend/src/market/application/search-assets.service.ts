import { Injectable } from '@nestjs/common';
import type { AssetSearchQueryDto, AssetSuggestionDto } from '@patrimo/shared';
import { MarketData } from '../domain/market-data.js';

@Injectable()
export class SearchAssetsService {
  constructor(private readonly market: MarketData) {}

  execute({ q }: AssetSearchQueryDto): Promise<AssetSuggestionDto[]> {
    return this.market.suggest(q);
  }
}
