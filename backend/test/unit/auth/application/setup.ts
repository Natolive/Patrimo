import { AuthenticateService } from '@src/auth/application/authenticate.service.js';
import { ChangePasswordService } from '@src/auth/application/change-password.service.js';
import { DisableTwoFactorService } from '@src/auth/application/disable-two-factor.service.js';
import { EnableTwoFactorService } from '@src/auth/application/enable-two-factor.service.js';
import { LoginTwoFactorService } from '@src/auth/application/login-two-factor.service.js';
import { LoginService } from '@src/auth/application/login.service.js';
import { LogoutService } from '@src/auth/application/logout.service.js';
import { OpenSessionService } from '@src/auth/application/open-session.service.js';
import type { OpenedSession } from '@src/auth/application/opened-session.js';
import { SetupTwoFactorService } from '@src/auth/application/setup-two-factor.service.js';
import { totp } from '@src/auth/application/totp.js';
import { TwoFactorChallenges } from '@src/auth/application/two-factor-challenges.js';
import { UpdateProfileService } from '@src/auth/application/update-profile.service.js';
import { toUserDto } from '@src/users/domain/to-user-dto.js';
import { FakePasswordHasher } from '@test/fakes/fake-password-hasher.js';
import { InMemorySessionRepository } from '@test/fakes/in-memory-session.repository.js';
import { InMemoryUserRepository } from '@test/fakes/in-memory-user.repository.js';

export const credentials = { email: 'lea@example.com', password: '12345678' };

// Résultat d'une connexion sans 2FA : la session ouverte.
export function opened(result: OpenedSession | { challenge: string }): OpenedSession {
  if ('challenge' in result) throw new Error('2FA demandée');
  return result;
}

// Cas d'usage d'auth câblés sur des fakes en mémoire : les parcours s'enchaînent comme en vrai.
export async function setupAuth() {
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository();
  const hasher = new FakePasswordHasher();
  const challenges = new TwoFactorChallenges();
  const openSession = new OpenSessionService(sessions);
  const login = new LoginService(users, hasher, openSession, challenges);
  const setupTwoFactor = new SetupTwoFactorService(users);
  const enableTwoFactor = new EnableTwoFactorService(users);
  // Compte créé comme par `npm run user:create`.
  const createUser = async () =>
    users.create({ email: credentials.email, firstName: 'Léa', lastName: 'Dupont', passwordHash: await hasher.hash(credentials.password) });

  return {
    users,
    sessions,
    challenges,
    createUser,
    login,
    loginTwoFactor: new LoginTwoFactorService(users, challenges, openSession),
    logout: new LogoutService(sessions),
    authenticate: new AuthenticateService(sessions, users),
    updateProfile: new UpdateProfileService(users),
    changePassword: new ChangePasswordService(users, hasher, sessions),
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor: new DisableTwoFactorService(users, hasher),
    // Compte créé puis connecté.
    loggedIn: async () => {
      await createUser();
      return opened(await login.execute(credentials));
    },
    // Compte avec 2FA active : sa clé et ses codes de secours.
    withTwoFactor: async () => {
      const user = toUserDto(await createUser());
      const { secret } = await setupTwoFactor.execute(user);
      const { recoveryCodes } = await enableTwoFactor.execute(user, { code: totp(secret) });
      return { user, secret, recoveryCodes };
    },
  };
}
