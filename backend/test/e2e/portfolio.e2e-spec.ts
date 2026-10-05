import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@src/app.module.js';
import { ScryptPasswordHasher } from '@src/auth/infrastructure/scrypt-password-hasher.js';
import { DB, type Database } from '@src/common/infrastructure/database/database.module.js';
import { MarketData } from '@src/market/domain/market-data.js';
import { users } from '@src/users/infrastructure/user.table.js';
import { FakeMarketData } from '@test/fakes/fake-market-data.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

// Achats puis tableau de bord sur la vraie base, cours fournis par FakeMarketData.
describe('Portfolio (e2e)', () => {
  const email = `e2e-portfolio-${Date.now()}@example.com`;
  let app: INestApplication;
  let db: Database;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(MarketData).useValue(new FakeMarketData()).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    db = app.get(DB);
    await db.insert(users).values({ email, firstName: 'Léa', lastName: 'Dupont', passwordHash: await new ScryptPasswordHasher().hash('12345678') });
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, email));
    await app.close();
  });

  it('records purchases and values them', async () => {
    const http = request.agent(app.getHttpServer());
    await http.get('/purchases').expect(401);
    await http.get('/portfolio').expect(401);
    await http.post('/auth/login').send({ email, password: '12345678' }).expect(200);

    await http.post('/purchases').send({ asset: 'FR0000120073', boughtAt: '2026-01-02', quantity: 'abc', unitPrice: '100', fees: '0' }).expect(400);
    await http.post('/purchases').send({ asset: 'NOPE', boughtAt: '2026-01-02', quantity: '1', unitPrice: '100', fees: '0' }).expect(404);
    const { body: bought } = await http
      .post('/purchases')
      .send({ asset: 'FR0000120073', boughtAt: '2026-01-02', quantity: '10', unitPrice: '100,505', fees: '1,99' })
      .expect(201);
    // Prix à 3 décimales gardé tel quel.
    expect(bought).toMatchObject({ symbol: 'AI.PA', quantity: 10, unitPrice: 100.505, fees: 1.99 });
    expect(bought.total).toBeCloseTo(1007.04);
    expect((await http.get('/purchases').expect(200)).body).toHaveLength(1);

    const { body: portfolio } = await http.get('/portfolio').expect(200);
    expect(portfolio).toMatchObject({ value: 1200, dayChange: 100 });
    expect(portfolio.invested).toBeCloseTo(1007.04);
    expect(portfolio.positions[0]).toMatchObject({ symbol: 'AI.PA', weight: 1, trend: { signal: null } });

    const { body: asset } = await http.get('/portfolio/AI.PA').expect(200);
    expect(asset.points).toHaveLength(3);
    await http.get('/portfolio/CW8.PA').expect(404);

    const { body: watches } = await http.get('/watches').expect(200);
    expect(watches).toMatchObject([{ symbol: 'AI.PA', price: 120 }]);
    const watch = watches[0];
    await http.post('/watches').send({ asset: '' }).expect(400);
    // Déjà suivie depuis l'achat.
    await http.post('/watches').send({ asset: 'AI.PA' }).expect(409);
    expect((await http.get('/watches').expect(200)).body).toHaveLength(1);
    expect((await http.get('/portfolio/AI.PA').expect(200)).body.watchId).toBe(watch.id);
    await http.delete(`/watches/${randomUUID()}`).expect(404);
    await http.delete(`/watches/${watch.id}`).expect(204);

    // Vente : 4 titres sur 10, puis une vente de trop refusée, et l'achat gardé tant que la vente en dépend.
    await http.post('/purchases').send({ side: 'sell', asset: 'AI.PA', boughtAt: '2026-01-06', quantity: '11', unitPrice: '120', fees: '0' }).expect(400);
    const { body: sold } = await http
      .post('/purchases')
      .send({ side: 'sell', asset: 'AI.PA', boughtAt: '2026-01-06', quantity: '4', unitPrice: '120', fees: '1' })
      .expect(201);
    expect(sold).toMatchObject({ side: 'sell', total: 479 });
    const { body: afterSale } = await http.get('/portfolio').expect(200);
    expect(afterSale.positions[0].quantity).toBe(6);
    expect(afterSale.realizedGain).toBeCloseTo(479 - 0.4 * 1007.04);
    await http.delete(`/purchases/${bought.id}`).expect(400);
    await http.delete(`/purchases/${sold.id}`).expect(204);

    await http.delete('/purchases/nope').expect(400);
    await http.delete(`/purchases/${randomUUID()}`).expect(404);
    await http.delete(`/purchases/${bought.id}`).expect(204);
    expect((await http.get('/portfolio').expect(200)).body.positions).toEqual([]);
  });
});
