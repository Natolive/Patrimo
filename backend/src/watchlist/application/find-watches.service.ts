import { Injectable } from '@nestjs/common';
import type { UserDto, WatchDto } from '@patrimo/shared';
import { MarketData } from '../../market/domain/market-data.js';
import { buildQuote } from '../../portfolio/domain/build-quote.js';
import { toWatchDto } from '../domain/to-watch-dto.js';
import { WatchRepository } from '../domain/watch.repository.js';

@Injectable()
export class FindWatchesService {
  constructor(
    private readonly watches: WatchRepository,
    private readonly market: MarketData,
  ) {}

  async execute(user: UserDto): Promise<WatchDto[]> {
    const watches = await this.watches.findByUser(user.id);
    return Promise.all(watches.map(async (w) => toWatchDto(w, buildQuote(await this.market.history(w.symbol)))));
  }
}
