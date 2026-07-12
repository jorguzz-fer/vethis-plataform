import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DB, type Database } from '../db/client';

/** Healthcheck — GET /v1/health. Verifica processo + conectividade do banco. */
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(@Inject(DB) private readonly db: Database) {}

  @Get()
  async check(): Promise<{ status: string; db: 'up' | 'down' }> {
    let dbStatus: 'up' | 'down' = 'down';
    try {
      await this.db.execute(sql`select 1`);
      dbStatus = 'up';
    } catch {
      dbStatus = 'down';
    }
    return { status: 'ok', db: dbStatus };
  }
}
