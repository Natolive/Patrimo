import { Controller, Get, Param, Query } from '@nestjs/common';
import { assetSearchQuerySchema, type AssetSearchQueryDto, type AssetSuggestionDto, type LastPriceDto, type MarketSessionDto } from '@patrimo/shared';
import { Authorize } from '../../../auth/infrastructure/http/authorize.decorator.js';
import { ZodValidationPipe } from '../../../common/infrastructure/http/pipes/zod-validation.pipe.js';
import { FindLastPriceService } from '../../application/find-last-price.service.js';
import { FindMarketSessionsService } from '../../application/find-market-sessions.service.js';
import { SearchAssetsService } from '../../application/search-assets.service.js';

@Controller('markets')
export class MarketsController {
  constructor(
    private readonly findMarketSessionsService: FindMarketSessionsService,
    private readonly searchAssetsService: SearchAssetsService,
    private readonly findLastPriceService: FindLastPriceService,
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
}
