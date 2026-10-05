import { Module } from '@nestjs/common';
import { UserRepository } from './domain/user.repository.js';
import { DrizzleUserRepository } from './infrastructure/drizzle-user.repository.js';

// Le compte connecté (inscription, connexion) se gère dans AuthModule.
@Module({
  providers: [{ provide: UserRepository, useClass: DrizzleUserRepository }],
  exports: [UserRepository],
})
export class UsersModule {}
