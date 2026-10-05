import type { UserDto } from '@pea/shared';

export interface OpenedSession {
  token: string;
  expiresAt: Date;
  remember: boolean;
  user: UserDto;
}
