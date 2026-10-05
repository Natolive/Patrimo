import type { UserDto } from '@patrimo/shared';
import type { User } from './user.entity.js';

export const toUserDto = ({ id, email, firstName, lastName }: User): UserDto => ({ id, email, firstName, lastName });
