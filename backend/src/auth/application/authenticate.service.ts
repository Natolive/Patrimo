import { Injectable } from '@nestjs/common';
import type { UserDto } from '@patrimo/shared';
import { orThrow } from '../../common/application/or-throw.js';
import { UserNotFoundError } from '../../users/domain/errors/user-not-found.error.js';
import { toUserDto } from '../../users/domain/to-user-dto.js';
import { UserRepository } from '../../users/domain/user.repository.js';
import { SessionExpiredError } from '../domain/errors/session-expired.error.js';
import { SessionRepository } from '../domain/session.repository.js';
import { hashToken } from './hash-token.js';

// Appelé par SessionGuard sur chaque route protégée.
@Injectable()
export class AuthenticateService {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly users: UserRepository,
  ) {}

  // ponytail: les sessions expirées restent en base, ajouter un nettoyage planifié si la table grossit.
  async execute(token: string | undefined): Promise<UserDto> {
    const session = token && (await this.sessions.findValidByTokenHash(hashToken(token), new Date()));
    if (!session) throw new SessionExpiredError();
    return toUserDto(orThrow(await this.users.findById(session.userId), UserNotFoundError));
  }
}
