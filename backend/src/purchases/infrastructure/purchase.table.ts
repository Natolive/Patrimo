import { date, index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../users/infrastructure/user.table.js';

export const purchases = pgTable(
  'purchases',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    symbol: text().notNull(),
    name: text().notNull(),
    currency: text().notNull(),
    boughtAt: date('bought_at').notNull(),
    // numeric : montants exacts en base (fractions de titres possibles).
    quantity: numeric({ mode: 'number' }).notNull(),
    unitPrice: numeric('unit_price', { mode: 'number' }).notNull(),
    fees: numeric({ mode: 'number' }).notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('purchases_user_id_idx').on(t.userId)],
);
