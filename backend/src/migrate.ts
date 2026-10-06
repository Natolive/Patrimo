import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

// Prod : applique les migrations de `drizzle/` au démarrage, sans drizzle-kit (devDependency absente de l'image).
// Même table de suivi que `npm run db:migrate` (drizzle.__drizzle_migrations) : les deux restent interchangeables.
const db = drizzle(process.env.DATABASE_URL!);
try {
  await migrate(db, { migrationsFolder: './drizzle' });
} finally {
  await db.$client.end();
}
