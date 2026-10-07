import type { PriceTick } from '@src/market/domain/price-tick.entity.js';
import { PriceStream } from '@src/market/domain/price-stream.js';

// Flux fixé par le test : `emit` pousse une cotation aux écouteurs de sa valeur et la garde comme dernière.
export class FakePriceStream extends PriceStream {
  readonly listeners = new Map<string, Set<(tick: PriceTick) => void>>();
  private readonly ticks = new Map<string, PriceTick>();

  subscribe(symbol: string, listener: (tick: PriceTick) => void) {
    const listeners = this.listeners.get(symbol) ?? new Set();
    this.listeners.set(symbol, listeners.add(listener));
    return () => {
      listeners.delete(listener);
      if (!listeners.size) this.listeners.delete(symbol);
    };
  }

  last(symbol: string) {
    return this.ticks.get(symbol);
  }

  emit(tick: PriceTick) {
    this.ticks.set(tick.symbol, tick);
    this.listeners.get(tick.symbol)?.forEach((listener) => listener(tick));
  }
}
