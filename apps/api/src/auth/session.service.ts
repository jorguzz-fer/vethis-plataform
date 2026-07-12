import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type Redis from 'ioredis';
import type { CookieOptions, Response } from 'express';
import { REDIS } from '../redis/redis.module';
import { APP_CONFIG, type AppConfig } from '../config/configuration';

export const SESSION_COOKIE = 'vethis_sid';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

interface SessionData {
  userId: string;
}

/**
 * Sessões server-side no Redis (ADR 0006). O cliente recebe apenas um id de
 * sessão opaco em cookie httpOnly assinado — nada de token no JS. Revogação é
 * imediata (basta apagar a chave no Redis).
 */
@Injectable()
export class SessionService {
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  private key(sid: string): string {
    return `sess:${sid}`;
  }

  async create(userId: string): Promise<string> {
    const sid = randomUUID();
    const data: SessionData = { userId };
    await this.redis.set(this.key(sid), JSON.stringify(data), 'EX', SESSION_TTL_SECONDS);
    return sid;
  }

  async getUserId(sid: string): Promise<string | null> {
    const raw = await this.redis.get(this.key(sid));
    if (!raw) return null;
    try {
      return (JSON.parse(raw) as SessionData).userId;
    } catch {
      return null;
    }
  }

  async destroy(sid: string): Promise<void> {
    await this.redis.del(this.key(sid));
  }

  private cookieOptions(): CookieOptions {
    const isProd = this.config.NODE_ENV === 'production';
    return {
      httpOnly: true,
      signed: true,
      sameSite: 'lax',
      secure: isProd,
      domain: this.config.COOKIE_DOMAIN,
      path: '/',
      maxAge: SESSION_TTL_SECONDS * 1000,
    };
  }

  setCookie(res: Response, sid: string): void {
    res.cookie(SESSION_COOKIE, sid, this.cookieOptions());
  }

  clearCookie(res: Response): void {
    const { maxAge: _maxAge, ...opts } = this.cookieOptions();
    void _maxAge;
    res.clearCookie(SESSION_COOKIE, opts);
  }
}
