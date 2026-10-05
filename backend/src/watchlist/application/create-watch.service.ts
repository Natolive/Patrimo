import { Injectable } from '@nestjs/common';
import type { SaveWatchDto, UserDto, WatchDto } from '@pea/shared';
import { AssetNotFoundError } from '../../market/domain/errors/asset-not-found.error.js';
import { MarketData } from '../../market/domain/market-data.js';
import { buildQuote } from '../../portfolio/domain/build-quote.js';
import { AlreadyWatchedError } from '../domain/errors/already-watched.error.js';
import { toWatchDto } from '../domain/to-watch-dto.js';
import { WatchRepository } from '../domain/watch.repository.js';

@Injectable()
export class CreateWatchService {
  constructor(
    private readonly watches: WatchRepository,
    private readonly market: MarketData,
  ) {}

  async execute(user: UserDto, { asset }: SaveWatchDto): Promise<WatchDto> {
    const instrument = await this.market.search(asset);
    if (!instrument) throw new AssetNotFoundError(asset);
    if ((await this.watches.findByUser(user.id)).some((w) => w.symbol === instrument.symbol)) throw new AlreadyWatchedError(instrument.name);
    const watch = await this.watches.create({ ...instrument, userId: user.id });
    return toWatchDto(watch, buildQuote(await this.market.history(watch.symbol)));
  }
}
