import type { UserDto } from '@patrimo/shared';

export interface OpenedSession {
  token: string;
  expiresAt: Date;
  remember: boolean;
  user: UserDto;
}
