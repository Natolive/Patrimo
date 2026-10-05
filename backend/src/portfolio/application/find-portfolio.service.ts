import { Injectable } from '@nestjs/common';
import type { PortfolioDto, UserDto } from '@patrimo/shared';
import { MarketData } from '../../market/domain/market-data.js';
import { PurchaseRepository } from '../../purchases/domain/purchase.repository.js';
import { buildPosition } from '../domain/build-position.js';
import { portfolioHistory } from '../domain/portfolio-history.js';

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

// ponytail: tous les montants additionnés tels quels, sans conversion de devise (portefeuille en euros, comme un PEA) ; convertir si des valeurs cotent dans d'autres devises.
@Injectable()
export class FindPortfolioService {
  constructor(
    private readonly purchases: PurchaseRepository,
    private readonly market: MarketData,
  ) {}

  async execute(user: UserDto): Promise<PortfolioDto> {
    const purchases = await this.purchases.findByUser(user.id);
    const symbols = [...new Set(purchases.map((p) => p.symbol))];
    const histories = new Map(await Promise.all(symbols.map(async (s) => [s, await this.market.history(s)] as const)));
    const lines = symbols.map((s) => buildPosition(purchases.filter((p) => p.symbol === s), histories.get(s)!));

    // Lignes soldées : seulement leur plus-value réalisée.
    const open = lines.filter((l) => l.quantity > 0);
    const value = sum(open.map((l) => l.value));
    const invested = sum(open.map((l) => l.invested));
    const dayChange = sum(open.map((l) => l.dayChange));
    return {
      invested,
      value,
      gain: value - invested,
      gainRate: invested ? value / invested - 1 : 0,
      realizedGain: sum(lines.map((l) => l.realizedGain)),
      dayChange,
      dayChangeRate: value ? dayChange / (value - dayChange) : 0,
      positions: open.map((l) => ({ ...l, weight: l.value / value })).sort((a, b) => b.value - a.value),
      history: portfolioHistory(purchases, histories),
    };
  }
}
