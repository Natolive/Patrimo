import type { User } from './user.entity.js';

export type NewUser = Omit<User, 'id' | 'createdAt'>;
