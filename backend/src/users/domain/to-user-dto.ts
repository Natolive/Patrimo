import type { UserDto } from '@pea/shared';
import type { User } from './user.entity.js';

export const toUserDto = ({ id, email, firstName, lastName }: User): UserDto => ({ id, email, firstName, lastName });
