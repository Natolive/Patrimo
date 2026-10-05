import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../users/infrastructure/user.table.js';

export const watches = pgTable(
  'watches',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    symbol: text().notNull(),
    name: text().notNull(),
    currency: text().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('watches_user_id_symbol_unique').on(t.userId, t.symbol)],
);
