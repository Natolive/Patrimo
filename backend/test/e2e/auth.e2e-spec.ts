import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@src/app.module.js';
import { DB, type Database } from '@src/common/infrastructure/database/database.module.js';
import { ScryptPasswordHasher } from '@src/auth/infrastructure/scrypt-password-hasher.js';
import { users } from '@src/users/infrastructure/user.table.js';
import { eq } from 'drizzle-orm';
import request from 'supertest';

// Parcours complet sur la vraie base (DATABASE_URL du conteneur back).
describe('Auth (e2e)', () => {
  const email = `e2e-${Date.now()}@example.com`;
  const account = { lastName: 'Dupont', firstName: 'Léa', email, password: '12345678' };
  let app: INestApplication;
  let db: Database;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    db = app.get(DB);
    // Pas d'inscription : compte créé comme par `npm run user:create`.
    const { password, ...rest } = account;
    await db.insert(users).values({ ...rest, passwordHash: await new ScryptPasswordHasher().hash(password) });
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, email));
    await app.close();
  });

  it('logs in, reads the profile, logs out, then logs back in', async () => {
    const http = request.agent(app.getHttpServer());

    await http.get('/auth/me').expect(401);
    await http.post('/auth/signup').send(account).expect(404);
    await http.post('/auth/login').send({ email: 'nope', password: account.password }).expect(400);
    const first = await http.post('/auth/login').send({ email, password: account.password }).expect(200);
    expect(first.headers['set-cookie']?.[0]).toMatch(/patrimo_session=.+HttpOnly/);

    const me = await http.get('/auth/me').expect(200);
    expect(me.body).toEqual({ id: expect.any(String), email, firstName: 'Léa', lastName: 'Dupont' });

    await http.post('/auth/logout').expect(204);
    await http.get('/auth/me').expect(401);
    await http.post('/auth/login').send({ email, password: 'wrong-password' }).expect(401);

    // Sans « Rester connecté » : cookie de session, effacé à la fermeture du navigateur ; avec, il a une date d'expiration.
    const remembered = await http.post('/auth/login').send({ email, password: account.password, remember: true }).expect(200);
    expect(remembered.headers['set-cookie']?.[0]).toMatch(/Expires=/);
    const login = await http.post('/auth/login').send({ email, password: account.password }).expect(200);
    expect(login.headers['set-cookie']?.[0]).not.toMatch(/Expires=/);
    await http.get('/auth/me').expect(200);
  });

  it('limits login attempts per email', async () => {
    const http = request(app.getHttpServer());
    const other = { email: `e2e-limit-${Date.now()}@example.com`, password: 'wrong-password' };
    for (let i = 0; i < 10; i++) await http.post('/auth/login').send(other).expect(401);
    await http.post('/auth/login').send(other).expect(429);
  });
});
