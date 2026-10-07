import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import type { PriceTick } from '../domain/price-tick.entity.js';
import { PriceStream } from '../domain/price-stream.js';
import { decodePricing } from './yahoo-pricing.js';

const URL = 'wss://streamer.finance.yahoo.com/?version=2';
const RETRY_MS = 5000;

// Flux de cotations de Yahoo Finance (celui de son site, non documenté) : un seul WebSocket pour tout le serveur,
// une valeur y est écoutée tant qu'au moins un navigateur la demande. Cours différés comme sur Yahoo (15 min à Paris).
// ponytail: reconnexion à intervalle fixe ; backoff exponentiel si Yahoo se met à refuser.
@Injectable()
export class YahooPriceStream extends PriceStream implements OnModuleDestroy {
  private socket?: WebSocket;
  private retry?: NodeJS.Timeout;
  private stopped = false;
  private readonly listeners = new Map<string, Set<(tick: PriceTick) => void>>();
  private readonly ticks = new Map<string, PriceTick>();

  subscribe(symbol: string, listener: (tick: PriceTick) => void): () => void {
    let listeners = this.listeners.get(symbol);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(symbol, listeners);
      this.send({ subscribe: [symbol] });
    }
    listeners.add(listener);
    this.connect();
    return () => {
      listeners.delete(listener);
      if (listeners.size) return;
      this.listeners.delete(symbol);
      this.ticks.delete(symbol);
      this.send({ unsubscribe: [symbol] });
    };
  }

  last(symbol: string): PriceTick | undefined {
    return this.ticks.get(symbol);
  }

  onModuleDestroy() {
    this.stopped = true;
    clearTimeout(this.retry);
    this.socket?.close();
  }

  private connect() {
    if (this.socket || this.stopped) return;
    const socket = new WebSocket(URL);
    this.socket = socket;
    socket.onopen = () => this.send({ subscribe: [...this.listeners.keys()] });
    socket.onmessage = (event: MessageEvent<string>) => {
      const tick = decodePricing((JSON.parse(event.data) as { message: string }).message);
      if (!tick || !this.listeners.has(tick.symbol)) return;
      this.ticks.set(tick.symbol, tick);
      for (const listener of this.listeners.get(tick.symbol)!) listener(tick);
    };
    // Coupure (Yahoo, réseau) : on se reconnecte tant que quelqu'un écoute.
    socket.onclose = () => {
      this.socket = undefined;
      if (this.listeners.size && !this.stopped) this.retry = setTimeout(() => this.connect(), RETRY_MS);
    };
  }

  private send(message: object) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }
}
