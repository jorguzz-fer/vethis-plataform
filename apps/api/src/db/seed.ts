import { loadConfig } from '../config/configuration';
import { createDb } from './client';

/**
 * Seed de desenvolvimento. Idempotente. No M1a ainda não há dados de domínio
 * para semear (catálogo/usuários com senha entram no M1b); mantém o ponto de
 * entrada pronto e valida a conexão.
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const { sql } = createDb(config.DATABASE_URL);
  await sql`select 1`;
  console.log('Seed: conexão OK — nada a semear no M1a.');
  await sql.end();
}

main().catch((err) => {
  console.error('Falha no seed:', err);
  process.exit(1);
});
