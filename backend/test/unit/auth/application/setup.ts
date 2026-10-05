import type { SignupDto } from '@pea/shared';
import { AuthenticateService } from '@src/auth/application/authenticate.service.js';
import { LoginService } from '@src/auth/application/login.service.js';
import { LogoutService } from '@src/auth/application/logout.service.js';
import { OpenSessionService } from '@src/auth/application/open-session.service.js';
import { SignupService } from '@src/auth/application/signup.service.js';
import { FakePasswordHasher } from '@test/fakes/fake-password-hasher.js';
import { InMemorySessionRepository } from '@test/fakes/in-memory-session.repository.js';
import { InMemoryUserRepository } from '@test/fakes/in-memory-user.repository.js';

export const dto: SignupDto = { lastName: 'Dupont', firstName: 'Léa', email: 'lea@example.com', password: '12345678' };
export const credentials = { email: dto.email, password: dto.password };

// Cas d'usage d'auth câblés sur des fakes en mémoire : les parcours s'enchaînent comme en vrai.
export async function setupAuth() {
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository();
  const hasher = new FakePasswordHasher();
  const openSession = new OpenSessionService(sessions);
  const signup = new SignupService(users, hasher, openSession);
  const login = new LoginService(users, hasher, openSession);

  return {
    users,
    sessions,
    signup,
    login,
    logout: new LogoutService(sessions),
    authenticate: new AuthenticateService(sessions, users),
    // Compte inscrit puis connecté.
    loggedIn: async () => {
      await signup.execute(dto);
      return login.execute(credentials);
    },
  };
}
