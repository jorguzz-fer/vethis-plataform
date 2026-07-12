import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/** Cria o cliente Drizzle sobre postgres.js. `max` conservador para dev. */
export function createDb(url: string) {
  const sql = postgres(url, { max: 10 });
  const db = drizzle(sql, { schema, casing: 'snake_case' });
  return { db, sql };
}

/** Tipo do handle Drizzle usado em toda a aplicação. */
export type Database = ReturnType<typeof createDb>['db'];

/** Token de injeção do banco. Injetar com `@Inject(DB) db: Database`. */
export const DB = 'DB_CONNECTION';
