import { decodePricing } from '@src/market/infrastructure/yahoo-pricing.js';
import { YahooPriceStream } from '@src/market/infrastructure/yahoo-price-stream.js';

// Message réel du flux Yahoo pour AI.PA (protobuf en base64).
const AI_PA = 'CgVBSS5QQRXNTClDGJDbz9eiaCoDUEFSMAg4AUWdP/I9SOKjB2UAzEw+2AEE9QIAzEw+/QKdP/I9';
const hex = (h: string) => Buffer.from(h.replace(/ /g, ''), 'hex').toString('base64');

describe('decodePricing', () => {
  it('reads a real Yahoo message', () => {
    const tick = decodePricing(AI_PA)!;
    expect(tick).toMatchObject({ symbol: 'AI.PA', dayVolume: 59633 });
    expect(tick.price).toBeCloseTo(169.3, 3);
    expect(tick.change).toBeCloseTo(0.2, 3);
    expect(tick.changeRate).toBeCloseTo(0.001182, 5);
    expect(tick.time.getTime()).toBeGreaterThan(Date.parse('2026-10-07'));
  });

  it('skips 64-bit fields and defaults the missing variations to zero', () => {
    // Symbole, cours, heure (zigzag de 1000 ms), puis un champ 20 sur 8 octets.
    expect(decodePricing(hex('0a 05 41492e5041 15 cd4c2943 18 d00f a101 0000000000000000'))).toEqual({
      symbol: 'AI.PA',
      price: expect.closeTo(169.3, 3),
      time: new Date(1000),
      change: 0,
      changeRate: 0,
      dayVolume: 0,
    });
  });

  it('rejects an unknown wire type or a message without symbol, price or time', () => {
    expect(decodePricing(hex('0b'))).toBeNull();
    expect(decodePricing(hex('15 cd4c2943'))).toBeNull();
  });
});

// Faux WebSocket : `open()` simule la connexion, `close()` la coupure.
class FakeSocket {
  static OPEN = 1;
  static all: FakeSocket[] = [];
  readyState = 0;
  sent: unknown[] = [];
  onopen?: () => void;
  onmessage?: (event: { data: string }) => void;
  onclose?: () => void;
  constructor(readonly url: string) {
    FakeSocket.all.push(this);
  }
  send(message: string) {
    this.sent.push(JSON.parse(message));
  }
  open() {
    this.readyState = FakeSocket.OPEN;
    this.onopen?.();
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  receive(message: string) {
    this.onmessage?.({ data: JSON.stringify({ type: 'pricing', message }) });
  }
}

describe('YahooPriceStream', () => {
  beforeEach(() => {
    FakeSocket.all = [];
    vi.stubGlobal('WebSocket', FakeSocket);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('opens one connection, subscribes the listened values and pushes their ticks', () => {
    const stream = new YahooPriceStream();
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = stream.subscribe('AI.PA', first);
    const stopSecond = stream.subscribe('AI.PA', second);
    const socket = FakeSocket.all[0]!;
    expect(FakeSocket.all).toHaveLength(1);
    socket.open();
    expect(socket.sent).toEqual([{ subscribe: ['AI.PA'] }]);
    stream.subscribe('MC.PA', vi.fn());
    expect(socket.sent.at(-1)).toEqual({ subscribe: ['MC.PA'] });

    socket.receive(AI_PA);
    socket.receive(hex('0b'));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(stream.last('AI.PA')?.symbol).toBe('AI.PA');

    stopFirst();
    expect(socket.sent).toHaveLength(2);
    stopSecond();
    expect(socket.sent.at(-1)).toEqual({ unsubscribe: ['AI.PA'] });
    expect(stream.last('AI.PA')).toBeUndefined();
    // Valeur plus écoutée : ses cotations sont ignorées.
    socket.receive(AI_PA);
    expect(stream.last('AI.PA')).toBeUndefined();
  });

  it('reconnects after a cut while someone listens, not once stopped', () => {
    vi.useFakeTimers();
    const stream = new YahooPriceStream();
    const stop = stream.subscribe('AI.PA', vi.fn());
    FakeSocket.all[0]!.close();
    vi.advanceTimersByTime(5000);
    expect(FakeSocket.all).toHaveLength(2);
    FakeSocket.all[1]!.open();
    expect(FakeSocket.all[1]!.sent).toEqual([{ subscribe: ['AI.PA'] }]);

    stop();
    FakeSocket.all[1]!.close();
    vi.advanceTimersByTime(5000);
    expect(FakeSocket.all).toHaveLength(2);

    stream.subscribe('AI.PA', vi.fn());
    stream.onModuleDestroy();
    vi.advanceTimersByTime(5000);
    stream.subscribe('MC.PA', vi.fn());
    expect(FakeSocket.all).toHaveLength(3);
  });
});
