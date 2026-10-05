import type { Watch } from './watch.entity.js';

export type NewWatch = Omit<Watch, 'id' | 'createdAt'>;
