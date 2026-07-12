import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { HealthModule } from './health/health.module';

/**
 * Raiz da API Vethis. Módulos de domínio (auth, catalog, orders, enrollment,
 * secretaria, crm, analytics) são adicionados nos próximos chunks do M1+.
 */
@Module({
  imports: [ConfigModule, DbModule, HealthModule],
})
export class AppModule {}
