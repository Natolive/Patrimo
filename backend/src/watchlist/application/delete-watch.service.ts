import { Injectable } from '@nestjs/common';
import type { UserDto } from '@patrimo/shared';
import { WatchRepository } from '../domain/watch.repository.js';
import { findMyWatch } from './find-my-watch.js';

@Injectable()
export class DeleteWatchService {
  constructor(private readonly watches: WatchRepository) {}

  async execute(user: UserDto, id: string): Promise<void> {
    await findMyWatch(this.watches, user, id);
    await this.watches.delete(id);
  }
}
