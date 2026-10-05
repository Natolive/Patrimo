import { EmailAlreadyUsedError } from '@src/users/domain/errors/email-already-used.error.js';
import { dto, setupAuth } from './setup.js';

describe('SignupService', () => {
  it('creates the account with a hashed password and logs it in', async () => {
    const auth = await setupAuth();
    const session = await auth.signup.execute(dto);
    expect(auth.users.rows[0].passwordHash).toBe('hashed:12345678');
    expect(session.user).toEqual({ id: '1', email: dto.email, firstName: 'Léa', lastName: 'Dupont' });
    expect(await auth.authenticate.execute(session.token)).toEqual(session.user);
  });

  it('refuses an email already used', async () => {
    const auth = await setupAuth();
    await auth.signup.execute(dto);
    await expect(auth.signup.execute(dto)).rejects.toBeInstanceOf(EmailAlreadyUsedError);
  });
});
