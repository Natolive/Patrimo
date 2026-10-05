import { AuthenticateService } from '@src/auth/application/authenticate.service.js';
import { LoginService } from '@src/auth/application/login.service.js';
import { LogoutService } from '@src/auth/application/logout.service.js';
import { OpenSessionService } from '@src/auth/application/open-session.service.js';
import { FakePasswordHasher } from '@test/fakes/fake-password-hasher.js';
import { InMemorySessionRepository } from '@test/fakes/in-memory-session.repository.js';
import { InMemoryUserRepository } from '@test/fakes/in-memory-user.repository.js';

export const credentials = { email: 'lea@example.com', password: '12345678' };

// Cas d'usage d'auth câblés sur des fakes en mémoire : les parcours s'enchaînent comme en vrai.
export async function setupAuth() {
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository();
  const hasher = new FakePasswordHasher();
  const openSession = new OpenSessionService(sessions);
  const login = new LoginService(users, hasher, openSession);
  // Compte créé comme par `npm run user:create`.
  const createUser = async () =>
    users.create({ email: credentials.email, firstName: 'Léa', lastName: 'Dupont', passwordHash: await hasher.hash(credentials.password) });

  return {
    users,
    sessions,
    createUser,
    login,
    logout: new LogoutService(sessions),
    authenticate: new AuthenticateService(sessions, users),
    // Compte créé puis connecté.
    loggedIn: async () => {
      await createUser();
      return login.execute(credentials);
    },
  };
}
