import type { UserDto } from '@patrimo/shared';
import { WatchNotFoundError } from '../domain/errors/watch-not-found.error.js';
import type { Watch } from '../domain/watch.entity.js';
import type { WatchRepository } from '../domain/watch.repository.js';

// La valeur suivie par un autre compte répond comme une valeur inconnue.
export async function findMyWatch(watches: WatchRepository, user: UserDto, id: string): Promise<Watch> {
  const watch = await watches.findById(id);
  if (watch?.userId !== user.id) throw new WatchNotFoundError();
  return watch;
}
