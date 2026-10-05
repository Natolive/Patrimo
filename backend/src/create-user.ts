import { createUserSchema } from '@pea/shared';
import { drizzle } from 'drizzle-orm/node-postgres';
import { z } from 'zod';
import { ScryptPasswordHasher } from './auth/infrastructure/scrypt-password-hasher.js';
import * as schema from './common/infrastructure/database/schema.js';
import { DrizzleUserRepository } from './users/infrastructure/drizzle-user.repository.js';

// Pas d'inscription : les comptes se créent ici.
// `docker compose exec backend npm run user:create -- <email> <mot de passe> <prénom> <nom>`
const [email, password, firstName, lastName] = process.argv.slice(2);
const parsed = createUserSchema.safeParse({ email, password, firstName, lastName });
if (!parsed.success) {
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}

const { password: plain, ...dto } = parsed.data;
const db = drizzle(process.env.DATABASE_URL!, { schema });
try {
  const user = await new DrizzleUserRepository(db).create({ ...dto, passwordHash: await new ScryptPasswordHasher().hash(plain) });
  console.log(`Compte créé : ${user.email}`);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await db.$client.end();
}
