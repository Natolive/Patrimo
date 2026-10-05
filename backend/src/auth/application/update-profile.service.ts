import { Injectable } from '@nestjs/common';
import type { UpdateProfileDto, UserDto } from '@patrimo/shared';
import { orThrow } from '../../common/application/or-throw.js';
import { UserNotFoundError } from '../../users/domain/errors/user-not-found.error.js';
import { toUserDto } from '../../users/domain/to-user-dto.js';
import { UserRepository } from '../../users/domain/user.repository.js';

@Injectable()
export class UpdateProfileService {
  constructor(private readonly users: UserRepository) {}

  async execute(user: UserDto, dto: UpdateProfileDto): Promise<UserDto> {
    return toUserDto(orThrow(await this.users.update(user.id, dto), UserNotFoundError));
  }
}
