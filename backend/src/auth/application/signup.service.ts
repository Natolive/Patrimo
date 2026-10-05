import { Injectable } from '@nestjs/common';
import type { SignupDto } from '@pea/shared';
import { EmailAlreadyUsedError } from '../../users/domain/errors/email-already-used.error.js';
import { UserRepository } from '../../users/domain/user.repository.js';
import { PasswordHasher } from '../domain/password-hasher.js';
import { OpenSessionService } from './open-session.service.js';
import type { OpenedSession } from './opened-session.js';

// Compte créé et connecté d'un coup.
// ponytail: pas de confirmation d'email (footix l'a : SignupService + VerifyEmailService + MailModule) ; à reprendre si l'appli s'ouvre au public.
@Injectable()
export class SignupService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly openSession: OpenSessionService,
  ) {}

  async execute({ password, ...dto }: SignupDto): Promise<OpenedSession> {
    if (await this.users.findByEmail(dto.email)) throw new EmailAlreadyUsedError();
    const user = await this.users.create({ ...dto, passwordHash: await this.hasher.hash(password) });
    return this.openSession.execute(user, false);
  }
}
