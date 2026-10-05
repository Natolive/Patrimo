import type { Request } from 'express';
import type { UserDto } from '@pea/shared';

// Requête passée par SessionGuard : la personne connectée y est attachée.
export type AuthenticatedRequest = Request & { user: UserDto };
