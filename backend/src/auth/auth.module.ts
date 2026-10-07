import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module.js';
import { AuthenticateService } from './application/authenticate.service.js';
import { ChangePasswordService } from './application/change-password.service.js';
import { DisableTwoFactorService } from './application/disable-two-factor.service.js';
import { EnableTwoFactorService } from './application/enable-two-factor.service.js';
import { LoginTwoFactorService } from './application/login-two-factor.service.js';
import { LoginService } from './application/login.service.js';
import { LogoutService } from './application/logout.service.js';
import { OpenSessionService } from './application/open-session.service.js';
import { SetupTwoFactorService } from './application/setup-two-factor.service.js';
import { TwoFactorChallenges } from './application/two-factor-challenges.js';
import { UpdateProfileService } from './application/update-profile.service.js';
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
    ChangePasswordService,
    DisableTwoFactorService,
    EnableTwoFactorService,
    LoginService,
    LoginTwoFactorService,
    LogoutService,
    OpenSessionService,
    SetupTwoFactorService,
    TwoFactorChallenges,
    UpdateProfileService,
    // Global : `@Authorize()` suffit sur une route de n'importe quel module.
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: PasswordHasher, useClass: ScryptPasswordHasher },
    { provide: SessionRepository, useClass: DrizzleSessionRepository },
  ],
  // Le WebSocket des cours vérifie la session lui-même (pas de guard sur une connexion).
  exports: [AuthenticateService],
})
export class AuthModule {}
