import { Injectable } from '@nestjs/common';
import type { PageDto, PageQueryDto, UserDto, WatchDto } from '@patrimo/shared';
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

  // Page de valeurs suivies, par ordre d'ajout : seuls les cours de la page sont demandés.
  // ponytail: page découpée en mémoire (quelques dizaines de valeurs par personne) ; en base si les listes deviennent longues.
  async execute(user: UserDto, { offset, limit }: PageQueryDto): Promise<PageDto<WatchDto>> {
    const watches = await this.watches.findByUser(user.id);
    const page = watches.slice(offset, offset + limit);
    const items = await Promise.all(page.map(async (w) => toWatchDto(w, buildQuote(await this.market.history(w.symbol)))));
    return { items, total: watches.length };
  }
}
