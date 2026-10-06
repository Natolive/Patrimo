import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@src/app.module.js';
import { ScryptPasswordHasher } from '@src/auth/infrastructure/scrypt-password-hasher.js';
import { DB, type Database } from '@src/common/infrastructure/database/database.module.js';
import { MarketData } from '@src/market/domain/market-data.js';
import { users } from '@src/users/infrastructure/user.table.js';
import { FakeMarketData } from '@test/fakes/fake-market-data.js';
import { FakeNewsFeed } from '@test/fakes/fake-news-feed.js';
import { NewsFeed } from '@src/news/domain/news-feed.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

// Achats puis tableau de bord sur la vraie base, cours fournis par FakeMarketData.
describe('Portfolio (e2e)', () => {
  const email = `e2e-portfolio-${Date.now()}@example.com`;
  let app: INestApplication;
  let db: Database;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(MarketData)
      .useValue(new FakeMarketData())
      .overrideProvider(NewsFeed)
      .useValue(new FakeNewsFeed())
      .compile();
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
    await http.get('/markets/sessions').expect(401);
    await http.get('/markets/search?q=liquide').expect(401);
    await http.post('/auth/login').send({ email, password: '12345678' }).expect(200);
    expect((await http.get('/markets/search?q=liquide').expect(200)).body).toMatchObject([{ symbol: 'AI.PA', type: 'equity' }]);
    await http.get('/markets/search?q=a').expect(400);
    expect((await http.get('/markets/price/AI.PA').expect(200)).body).toEqual({ symbol: 'AI.PA', price: 120, date: '2026-01-06' });
    await http.get('/markets/price/NOPE').expect(400);
    expect((await http.get('/markets/sessions').expect(200)).body).toEqual([{ key: 'hongKong', start: '2026-10-06T01:30:00.000Z', end: '2026-10-06T08:10:00.000Z', lastSession: '2026-10-05' }]);

    await http.post('/purchases').send({ asset: 'FR0000120073', boughtAt: '2026-01-02', quantity: 'abc', unitPrice: '100', fees: '0' }).expect(400);
    await http.post('/purchases').send({ asset: 'NOPE', boughtAt: '2026-01-02', quantity: '1', unitPrice: '100', fees: '0' }).expect(404);
    const { body: bought } = await http
      .post('/purchases')
      .send({ asset: 'FR0000120073', boughtAt: '2026-01-02', quantity: '10', unitPrice: '100,505', fees: '1,99' })
      .expect(201);
    // Prix à 3 décimales gardé tel quel.
    expect(bought).toMatchObject({ symbol: 'AI.PA', quantity: 10, unitPrice: 100.505, fees: 1.99 });
    expect(bought.total).toBeCloseTo(1007.04);
    expect((await http.get('/purchases').expect(200)).body).toMatchObject({ total: 1, items: [{ id: bought.id }] });
    expect((await http.get('/purchases?symbol=CW8.PA').expect(200)).body).toEqual({ total: 0, items: [] });
    await http.get('/purchases?limit=500').expect(400);

    const { body: portfolio } = await http.get('/portfolio').expect(200);
    expect(portfolio).toMatchObject({ value: 1200, dayChange: 100 });
    expect(portfolio.invested).toBeCloseTo(1007.04);
    expect(portfolio.positions[0]).toMatchObject({ symbol: 'AI.PA', weight: 1, trend: { signal: null } });

    const { body: asset } = await http.get('/portfolio/AI.PA').expect(200);
    expect(asset.points).toHaveLength(3);
    // Valeur ni détenue ni suivie : fiche quand même (arrivée depuis la recherche) ; symbole inconnu : 404.
    expect((await http.get('/portfolio/AI.PA').expect(200)).body).toMatchObject({ symbol: 'AI.PA' });
    await http.get('/portfolio/NOPE').expect(404);

    const { body: watches } = await http.get('/watches?limit=10').expect(200);
    expect(watches).toMatchObject({ total: 1, items: [{ symbol: 'AI.PA', price: 120 }] });
    const watch = watches.items[0];
    await http.get('/watches?offset=-1').expect(400);
    await http.post('/watches').send({ asset: '' }).expect(400);
    expect((await http.get(`/watches/${watch.id}/news`).expect(200)).body).toMatchObject({ query: "L'Air Liquide", suggested: true, items: [{ source: 'Exemple' }] });
    await http.patch(`/watches/${watch.id}`).send({ newsQuery: 'x'.repeat(201) }).expect(400);
    await http.patch(`/watches/${watch.id}`).send({ newsQuery: ' Air Liquide hydrogène ' }).expect(204);
    expect((await http.get(`/watches/${watch.id}/news`).expect(200)).body).toMatchObject({ query: 'Air Liquide hydrogène', suggested: false });
    await http.get(`/watches/${randomUUID()}/news`).expect(404);
    expect((await http.get('/watches/news').expect(200)).body).toMatchObject([{ assets: [{ symbol: 'AI.PA' }] }]);
    // Déjà suivie depuis l'achat.
    await http.post('/watches').send({ asset: 'AI.PA' }).expect(409);
    expect((await http.get('/watches').expect(200)).body.total).toBe(1);
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
    // Dividende : 6 titres × 1,50 €, à part de la plus-value réalisée.
    const { body: dividend } = await http
      .post('/purchases')
      .send({ side: 'dividend', asset: 'AI.PA', boughtAt: '2026-01-07', quantity: '6', unitPrice: '1,5', fees: '0' })
      .expect(201);
    expect((await http.get('/portfolio').expect(200)).body).toMatchObject({ dividends: 9, positions: [{ quantity: 6, dividends: 9 }] });
    await http.delete(`/purchases/${dividend.id}`).expect(204);
    // Correction : frais remboursés, puis une quantité qui laisserait la vente à découvert.
    const corrected = { asset: 'AI.PA', boughtAt: '2026-01-02', quantity: '10', unitPrice: '100,505', fees: '0' };
    expect((await http.put(`/purchases/${bought.id}`).send(corrected).expect(200)).body).toMatchObject({ id: bought.id, fees: 0, total: 1005.05 });
    await http.put(`/purchases/${bought.id}`).send({ ...corrected, quantity: '3' }).expect(400);
    await http.put(`/purchases/${bought.id}`).send({ ...corrected, quantity: 'abc' }).expect(400);
    await http.put(`/purchases/${randomUUID()}`).send(corrected).expect(404);
    await http.delete(`/purchases/${sold.id}`).expect(204);

    await http.delete('/purchases/nope').expect(400);
    await http.delete(`/purchases/${randomUUID()}`).expect(404);
    await http.delete(`/purchases/${bought.id}`).expect(204);
    expect((await http.get('/portfolio').expect(200)).body.positions).toEqual([]);
  });
});
