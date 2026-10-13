import { loadConfig } from '../config/configuration';
import { createDb } from './client';
import { crmInteractions, leads, opportunities } from './schema/crm';

/**
 * Zera o CRM: apaga oportunidades, interações e leads. NÃO toca em usuários,
 * matrículas, pedidos nem canais. Acionado pelo entrypoint com
 * RESET_CRM_ON_START=true (desligue a variável depois) ou via `db:reset-crm`.
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const { db, sql } = createDb(config.DATABASE_URL);
  const opps = await db.delete(opportunities).returning({ id: opportunities.id });
  const notes = await db.delete(crmInteractions).returning({ id: crmInteractions.id });
  const ls = await db.delete(leads).returning({ id: leads.id });
  console.log(
    `CRM zerado: ${opps.length} oportunidade(s), ${notes.length} interação(ões), ${ls.length} lead(s) removidos.`,
  );
  await sql.end();
}

main().catch((err) => {
  console.error('Falha ao zerar o CRM:', err);
  process.exit(1);
});
