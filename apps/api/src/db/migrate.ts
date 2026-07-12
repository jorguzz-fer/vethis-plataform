import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { loadConfig } from '../config/configuration';
import { createDb } from './client';

/** Aplica as migrations versionadas de ./drizzle. Idempotente. */
async function main(): Promise<void> {
  const config = loadConfig();
  const { db, sql } = createDb(config.DATABASE_URL);
  console.log('Aplicando migrations…');
  await migrate(db, { migrationsFolder: './drizzle' });
  await sql.end();
  console.log('Migrations aplicadas.');
}

main().catch((err) => {
  console.error('Falha nas migrations:', err);
  process.exit(1);
});
