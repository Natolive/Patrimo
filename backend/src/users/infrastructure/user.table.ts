import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  // Clé de l'application d'authentification (base32) ; posée dès la mise en place, active une fois `twoFactorEnabledAt` rempli.
  // ponytail: clé en clair en base (comme la plupart des applis) ; la chiffrer avec une clé serveur si la base doit être partagée.
  totpSecret: text('totp_secret'),
  twoFactorEnabledAt: timestamp('two_factor_enabled_at', { withTimezone: true }),
  // Codes de secours restants, hachés ; chacun ne sert qu'une fois.
  recoveryCodeHashes: text('recovery_code_hashes').array().notNull().default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
