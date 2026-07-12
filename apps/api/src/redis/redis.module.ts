import { Global, Inject, Logger, Module, type OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { APP_CONFIG, type AppConfig } from '../config/configuration';

/** Token de injeção do cliente Redis. Injetar com `@Inject(REDIS) redis: Redis`. */
export const REDIS = 'REDIS_CLIENT';

/**
 * Redis global (sessões + filas). `lazyConnect` deixa a aplicação bootar mesmo
 * sem o Redis no ar; a conexão abre na primeira operação.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: (config: AppConfig) => {
        const logger = new Logger('Redis');
        const client = new Redis(config.REDIS_URL, {
          lazyConnect: true,
          maxRetriesPerRequest: 2,
          enableReadyCheck: true,
        });
        // Evita "unhandled error event" quando o Redis está indisponível;
        // o ioredis reconecta sozinho. Loga só a mudança de estado.
        let lastErr = '';
        client.on('error', (err: Error) => {
          if (err.message !== lastErr) {
            lastErr = err.message;
            logger.warn(`Conexão Redis indisponível: ${err.message}`);
          }
        });
        client.on('ready', () => {
          lastErr = '';
          logger.log('Redis conectado.');
        });
        return client;
      },
      inject: [APP_CONFIG],
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
    } catch {
      this.redis.disconnect();
    }
  }
}
