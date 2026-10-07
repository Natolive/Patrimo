import type { INestApplication } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import { AppModule } from '@src/app.module.js';
import { ScryptPasswordHasher } from '@src/auth/infrastructure/scrypt-password-hasher.js';
import { DB, type Database } from '@src/common/infrastructure/database/database.module.js';
import { PriceStream } from '@src/market/domain/price-stream.js';
import { users } from '@src/users/infrastructure/user.table.js';
import { FakePriceStream } from '@test/fakes/fake-price-stream.js';
import { eq } from 'drizzle-orm';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { WebSocket } from 'ws';

// WebSocket `/stream` de bout en bout : session et origine vérifiées, cotations du flux poussées aux abonnés.
describe('Price stream (e2e)', () => {
  const email = `e2e-stream-${Date.now()}@example.com`;
  const origin = process.env.CORS_ORIGIN!;
  const stream = new FakePriceStream();
  let app: INestApplication;
  let db: Database;
  let url: string;
  let cookie: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PriceStream)
      .useValue(stream)
      .compile();
    app = moduleRef.createNestApplication();
    app.useWebSocketAdapter(new WsAdapter(app));
    await app.listen(0);
    url = `ws://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/stream`;
    db = app.get(DB);
    await db.insert(users).values({
      email,
      firstName: 'Léa',
      lastName: 'Dupont',
      passwordHash: await new ScryptPasswordHasher().hash('12345678'),
    });
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password: '12345678' }).expect(200);
    cookie = (login.headers['set-cookie'] as unknown as string[])[0]!.split(';')[0]!;
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, email));
    await app.close();
  });

  const connect = (headers: Record<string, string>) => new WebSocket(url, { headers });
  const closed = (ws: WebSocket) => new Promise<number>((resolve) => ws.on('close', resolve));
  const opened = (ws: WebSocket) => new Promise((resolve) => ws.on('open', resolve));
  const subscribe = (ws: WebSocket, data: unknown) => ws.send(JSON.stringify({ event: 'subscribe', data }));
  const until = async (check: () => boolean) => {
    while (!check()) await new Promise((resolve) => setTimeout(resolve, 10));
  };

  it('refuses a connection without session or from another site', async () => {
    expect(await closed(connect({ origin }))).toBe(4401);
    expect(await closed(connect({ origin: 'https://evil.example', cookie }))).toBe(4401);
  });

  it('pushes the ticks of the subscribed values until the connection closes', async () => {
    const ws = connect({ origin, cookie });
    const messages: unknown[] = [];
    ws.on('message', (data: Buffer) => messages.push(JSON.parse(data.toString())));
    await opened(ws);
    subscribe(ws, { symbols: 'AI.PA' });
    subscribe(ws, { symbols: ['MC.PA'] });
    subscribe(ws, { symbols: ['AI.PA'] });
    await until(() => stream.listeners.has('AI.PA'));
    expect(stream.listeners.has('MC.PA')).toBe(false);

    stream.emit({
      symbol: 'AI.PA',
      price: 169.5,
      time: new Date('2026-10-07T08:24:00Z'),
      change: 0.4,
      changeRate: 0.0024,
      dayVolume: 1000,
    });
    await until(() => messages.length > 0);
    expect(messages).toEqual([
      {
        event: 'tick',
        data: {
          symbol: 'AI.PA',
          price: 169.5,
          time: '2026-10-07T08:24:00.000Z',
          change: 0.4,
          changeRate: 0.0024,
          dayVolume: 1000,
        },
      },
    ]);

    ws.close();
    await until(() => !stream.listeners.has('AI.PA'));
  });
});
