import { Injectable } from '@nestjs/common';
import type { UserDto } from '@pea/shared';
import { WatchNotFoundError } from '../domain/errors/watch-not-found.error.js';
import { WatchRepository } from '../domain/watch.repository.js';

@Injectable()
export class DeleteWatchService {
  constructor(private readonly watches: WatchRepository) {}

  // La valeur suivie par un autre compte répond comme une valeur inconnue.
  async execute(user: UserDto, id: string): Promise<void> {
    const watch = await this.watches.findById(id);
    if (watch?.userId !== user.id) throw new WatchNotFoundError();
    await this.watches.delete(id);
  }
}
