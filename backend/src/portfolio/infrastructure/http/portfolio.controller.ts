import { Controller, Get, Param } from '@nestjs/common';
import type { AssetDto, PortfolioDto, UserDto } from '@patrimo/shared';
import { Authorize } from '../../../auth/infrastructure/http/authorize.decorator.js';
import { CurrentUser } from '../../../auth/infrastructure/http/current-user.decorator.js';
import { FindAssetService } from '../../application/find-asset.service.js';
import { FindPortfolioService } from '../../application/find-portfolio.service.js';

@Controller('portfolio')
export class PortfolioController {
  constructor(
    private readonly findPortfolioService: FindPortfolioService,
    private readonly findAssetService: FindAssetService,
  ) {}

  @Get()
  @Authorize()
  find(@CurrentUser() user: UserDto): Promise<PortfolioDto> {
    return this.findPortfolioService.execute(user);
  }

  @Get(':symbol')
  @Authorize()
  findAsset(@CurrentUser() user: UserDto, @Param('symbol') symbol: string): Promise<AssetDto> {
    return this.findAssetService.execute(user, symbol);
  }
}
