import { StreamPricesService } from '@src/market/application/stream-prices.service.js';
import { FakePriceStream } from '@test/fakes/fake-price-stream.js';

describe('StreamPricesService', () => {
  it('pushes the ticks of the requested values once each, until stopped', () => {
    const stream = new FakePriceStream();
    const ticks: unknown[] = [];
    const stop = new StreamPricesService(stream).execute({ symbols: ['AI.PA', 'AI.PA'] }, (tick) => ticks.push(tick));
    const tick = {
      symbol: 'AI.PA',
      price: 169.5,
      time: new Date('2026-10-07T08:24:00Z'),
      change: 0.4,
      changeRate: 0.0024,
      dayVolume: 1000,
    };
    stream.emit(tick);
    stream.emit({ ...tick, symbol: 'MC.PA' });
    expect(ticks).toEqual([{ ...tick, time: '2026-10-07T08:24:00.000Z' }]);
    stop();
    expect(stream.listeners.size).toBe(0);
  });
});
