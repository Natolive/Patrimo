import type { INestApplication } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import { AppModule } from '@src/app.module.js';
import { DB, type Database } from '@src/common/infrastructure/database/database.module.js';
import { ScryptPasswordHasher } from '@src/auth/infrastructure/scrypt-password-hasher.js';
import { users } from '@src/users/infrastructure/user.table.js';
import { eq } from 'drizzle-orm';
import { totp } from '@src/auth/application/totp.js';
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
    app.useWebSocketAdapter(new WsAdapter(app));
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
    expect(me.body).toEqual({ id: expect.any(String), email, firstName: 'Léa', lastName: 'Dupont', twoFactorEnabled: false });

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

  it('edits the profile, changes the password, then turns 2FA on and off', async () => {
    const http = request.agent(app.getHttpServer());
    await http.post('/auth/login').send({ email, password: account.password }).expect(200, /"user"/);

    expect((await http.patch('/auth/me').send({ firstName: ' Léna ', lastName: 'Martin' }).expect(200)).body).toMatchObject({ firstName: 'Léna', lastName: 'Martin' });
    await http.patch('/auth/me').send({ firstName: '', lastName: 'Martin' }).expect(400);
    await http.post('/auth/me/password').send({ currentPassword: 'wrong', password: 'new-password' }).expect(400);
    await http.post('/auth/me/password').send({ currentPassword: account.password, password: 'court' }).expect(400);
    await http.post('/auth/me/password').send({ currentPassword: account.password, password: 'new-password' }).expect(204);
    await http.get('/auth/me').expect(200);

    // 2FA : clé, premier code, codes de secours.
    await http.post('/auth/me/2fa/enable').send({ code: '123456' }).expect(400);
    const { body: setup } = await http.post('/auth/me/2fa/setup').expect(200);
    expect(setup.otpauthUrl).toMatch(/^otpauth:\/\/totp\/Patrimo/);
    await http.post('/auth/me/2fa/enable').send({ code: 'abc' }).expect(400);
    const { body: codes } = await http.post('/auth/me/2fa/enable').send({ code: totp(setup.secret) }).expect(200);
    expect(codes.recoveryCodes).toHaveLength(8);
    await http.post('/auth/me/2fa/setup').expect(409);
    expect((await http.get('/auth/me').expect(200)).body.twoFactorEnabled).toBe(true);

    // Connexion : mot de passe, puis code.
    const fresh = request.agent(app.getHttpServer());
    const { body: step } = await fresh.post('/auth/login').send({ email, password: 'new-password', remember: true }).expect(200);
    expect(step).toEqual({ challenge: expect.any(String) });
    await fresh.get('/auth/me').expect(401);
    await fresh.post('/auth/login/2fa').send({ challenge: step.challenge, code: '12' }).expect(400);
    const done = await fresh.post('/auth/login/2fa').send({ challenge: step.challenge, code: codes.recoveryCodes[0] }).expect(200);
    expect(done.headers['set-cookie']?.[0]).toMatch(/patrimo_session=.+Expires=/);
    await fresh.get('/auth/me').expect(200);
    await fresh.post('/auth/login/2fa').send({ challenge: step.challenge, code: totp(setup.secret) }).expect(401);

    await http.post('/auth/me/2fa/disable').send({ password: 'wrong', code: totp(setup.secret) }).expect(400);
    await http.post('/auth/me/2fa/disable').send({ password: 'new-password', code: totp(setup.secret) }).expect(204);
    expect((await http.post('/auth/login').send({ email, password: 'new-password' }).expect(200)).body).toHaveProperty('user');
  });

  it('limits login attempts per email', async () => {
    const http = request(app.getHttpServer());
    const other = { email: `e2e-limit-${Date.now()}@example.com`, password: 'wrong-password' };
    for (let i = 0; i < 10; i++) await http.post('/auth/login').send(other).expect(401);
    await http.post('/auth/login').send(other).expect(429);
  });
});
