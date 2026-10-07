import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  assetSearchQuerySchema,
  candlesQuerySchema,
  type AssetSearchQueryDto,
  type AssetSuggestionDto,
  type CandlesDto,
  type CandlesQueryDto,
  type LastPriceDto,
  type MarketSessionDto,
} from '@patrimo/shared';
import { Authorize } from '../../../auth/infrastructure/http/authorize.decorator.js';
import { ZodValidationPipe } from '../../../common/infrastructure/http/pipes/zod-validation.pipe.js';
import { FindCandlesService } from '../../application/find-candles.service.js';
import { FindLastPriceService } from '../../application/find-last-price.service.js';
import { FindMarketSessionsService } from '../../application/find-market-sessions.service.js';
import { SearchAssetsService } from '../../application/search-assets.service.js';

@Controller('markets')
export class MarketsController {
  constructor(
    private readonly findMarketSessionsService: FindMarketSessionsService,
    private readonly searchAssetsService: SearchAssetsService,
    private readonly findLastPriceService: FindLastPriceService,
    private readonly findCandlesService: FindCandlesService,
  ) {}

  @Get('sessions')
  @Authorize()
  sessions(): Promise<MarketSessionDto[]> {
    return this.findMarketSessionsService.execute();
  }

  @Get('search')
  @Authorize()
  search(@Query(new ZodValidationPipe(assetSearchQuerySchema)) query: AssetSearchQueryDto): Promise<AssetSuggestionDto[]> {
    return this.searchAssetsService.execute(query);
  }

  @Get('price/:symbol')
  @Authorize()
  lastPrice(@Param('symbol') symbol: string): Promise<LastPriceDto> {
    return this.findLastPriceService.execute(symbol);
  }

  @Get('candles/:symbol')
  @Authorize()
  candles(@Param('symbol') symbol: string, @Query(new ZodValidationPipe(candlesQuerySchema)) query: CandlesQueryDto): Promise<CandlesDto> {
    return this.findCandlesService.execute(symbol, query);
  }
}
