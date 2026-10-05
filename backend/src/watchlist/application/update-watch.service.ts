import { Injectable } from '@nestjs/common';
import type { UpdateWatchDto, UserDto } from '@pea/shared';
import { WatchRepository } from '../domain/watch.repository.js';
import { findMyWatch } from './find-my-watch.js';

@Injectable()
export class UpdateWatchService {
  constructor(private readonly watches: WatchRepository) {}

  async execute(user: UserDto, id: string, dto: UpdateWatchDto): Promise<void> {
    await findMyWatch(this.watches, user, id);
    await this.watches.update(id, dto);
  }
}
