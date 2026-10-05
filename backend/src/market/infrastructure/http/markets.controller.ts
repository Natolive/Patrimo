import { Controller, Get } from '@nestjs/common';
import type { MarketSessionDto } from '@patrimo/shared';
import { Authorize } from '../../../auth/infrastructure/http/authorize.decorator.js';
import { FindMarketSessionsService } from '../../application/find-market-sessions.service.js';

@Controller('markets')
export class MarketsController {
  constructor(private readonly findMarketSessionsService: FindMarketSessionsService) {}

  @Get('sessions')
  @Authorize()
  sessions(): Promise<MarketSessionDto[]> {
    return this.findMarketSessionsService.execute();
  }
}
