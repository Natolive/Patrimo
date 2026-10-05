import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module.js';
import { AuthenticateService } from './application/authenticate.service.js';
import { LoginService } from './application/login.service.js';
import { LogoutService } from './application/logout.service.js';
import { OpenSessionService } from './application/open-session.service.js';
import { PasswordHasher } from './domain/password-hasher.js';
import { SessionRepository } from './domain/session.repository.js';
import { DrizzleSessionRepository } from './infrastructure/drizzle-session.repository.js';
import { AuthController } from './infrastructure/http/auth.controller.js';
import { SessionGuard } from './infrastructure/http/session.guard.js';
import { ScryptPasswordHasher } from './infrastructure/scrypt-password-hasher.js';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    AuthenticateService,
    LoginService,
    LogoutService,
    OpenSessionService,
    // Global : `@Authorize()` suffit sur une route de n'importe quel module.
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: PasswordHasher, useClass: ScryptPasswordHasher },
    { provide: SessionRepository, useClass: DrizzleSessionRepository },
  ],
})
export class AuthModule {}
