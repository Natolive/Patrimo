import { Injectable } from '@nestjs/common';
import type { PriceTickDto, StreamSubscribeDto } from '@patrimo/shared';
import { PriceStream } from '../domain/price-stream.js';

// Cotations en direct des valeurs demandées par un navigateur ; renvoie la fonction qui arrête tout.
@Injectable()
export class StreamPricesService {
  constructor(private readonly stream: PriceStream) {}

  execute({ symbols }: StreamSubscribeDto, listener: (tick: PriceTickDto) => void): () => void {
    const stops = [...new Set(symbols)].map((symbol) => this.stream.subscribe(symbol, (tick) => listener({ ...tick, time: tick.time.toISOString() })));
    return () => stops.forEach((stop) => stop());
  }
}
