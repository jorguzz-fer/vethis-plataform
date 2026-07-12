import { Global, Module, type OnModuleDestroy } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/configuration';
import { createDb, DB } from './client';

const SQL = 'DB_SQL';

/**
 * Banco de dados global. Provê o handle Drizzle (DB) e o cliente sql cru (SQL),
 * fechando a conexão no shutdown da aplicação.
 */
@Global()
@Module({
  providers: [
    {
      provide: SQL,
      useFactory: (config: AppConfig) => createDb(config.DATABASE_URL),
      inject: [APP_CONFIG],
    },
    {
      provide: DB,
      useFactory: (conn: ReturnType<typeof createDb>) => conn.db,
      inject: [SQL],
    },
  ],
  exports: [DB],
})
export class DbModule implements OnModuleDestroy {
  constructor(@Inject(SQL) private readonly conn: ReturnType<typeof createDb>) {}

  async onModuleDestroy(): Promise<void> {
    await this.conn.sql.end({ timeout: 5 });
  }
}
