import { WrongPasswordError } from '@src/auth/domain/errors/wrong-password.error.js';
import { UserNotFoundError } from '@src/users/domain/errors/user-not-found.error.js';
import { credentials, opened, setupAuth } from './setup.js';

describe('UpdateProfileService', () => {
  it('renames me', async () => {
    const auth = await setupAuth();
    const { user } = await auth.loggedIn();
    expect(await auth.updateProfile.execute(user, { firstName: 'Léna', lastName: 'Martin' })).toEqual({ ...user, firstName: 'Léna', lastName: 'Martin' });
    await expect(auth.updateProfile.execute({ ...user, id: 'gone' }, { firstName: 'X', lastName: 'Y' })).rejects.toBeInstanceOf(UserNotFoundError);
  });
});

describe('ChangePasswordService', () => {
  it('changes my password and signs out my other devices only', async () => {
    const auth = await setupAuth();
    const here = await auth.loggedIn();
    const elsewhere = opened(await auth.login.execute(credentials));
    await auth.changePassword.execute(here.user, here.token, { currentPassword: credentials.password, password: 'new-password' });
    await expect(auth.authenticate.execute(elsewhere.token)).rejects.toThrow();
    expect(await auth.authenticate.execute(here.token)).toMatchObject({ email: credentials.email });
    expect(opened(await auth.login.execute({ ...credentials, password: 'new-password' })).user.email).toBe(credentials.email);
  });

  it('needs the current password', async () => {
    const auth = await setupAuth();
    const { user, token } = await auth.loggedIn();
    await expect(auth.changePassword.execute(user, token, { currentPassword: 'wrong', password: 'new-password' })).rejects.toBeInstanceOf(WrongPasswordError);
    await expect(auth.changePassword.execute({ ...user, id: 'gone' }, token, { currentPassword: 'x', password: 'new-password' })).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('signs out every device when called without a session', async () => {
    const auth = await setupAuth();
    const { user, token } = await auth.loggedIn();
    await auth.changePassword.execute(user, undefined, { currentPassword: credentials.password, password: 'new-password' });
    await expect(auth.authenticate.execute(token)).rejects.toThrow();
  });
});
