import type { NewUser } from '@src/users/domain/new-user.entity.js';
import type { User } from '@src/users/domain/user.entity.js';
import { UserRepository } from '@src/users/domain/user.repository.js';
import { InMemoryRepository } from './in-memory.repository.js';

export class InMemoryUserRepository extends InMemoryRepository<User, NewUser> implements UserRepository {
  async findByEmail(email: string) {
    return this.rows.find((u) => u.email === email) ?? null;
  }
}
