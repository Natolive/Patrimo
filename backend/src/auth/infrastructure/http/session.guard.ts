import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticateService } from '../../application/authenticate.service.js';
import type { AuthenticatedRequest } from './authenticated-request.js';
import { readSessionCookie } from './session-cookie.js';

export const AUTHORIZE = 'authorize';

// Guard global (APP_GUARD) : n'agit que sur les routes marquées `@Authorize()`, les autres restent publiques.
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly authenticate: AuthenticateService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.reflector.get<boolean | undefined>(AUTHORIZE, context.getHandler())) return true;
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    req.user = await this.authenticate.execute(readSessionCookie(req));
    return true;
  }
}
