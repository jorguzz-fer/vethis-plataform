import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type Redis from 'ioredis';
import { DB, type Database } from '../db/client';
import { REDIS } from '../redis/redis.module';

type Status = 'up' | 'down';

/** Healthcheck — GET /v1/health. Verifica processo + banco + Redis. */
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get()
  async check(): Promise<{ status: string; db: Status; redis: Status }> {
    const [db, redis] = await Promise.all([this.pingDb(), this.pingRedis()]);
    return { status: 'ok', db, redis };
  }

  private async pingDb(): Promise<Status> {
    try {
      await this.db.execute(sql`select 1`);
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async pingRedis(): Promise<Status> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG' ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }
}
