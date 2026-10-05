import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
