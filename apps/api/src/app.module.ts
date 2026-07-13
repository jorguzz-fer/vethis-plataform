import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { CheckoutModule } from './checkout/checkout.module';
import { MeModule } from './me/me.module';
import { CrmModule } from './crm/crm.module';
import { AdminModule } from './admin/admin.module';
import { OpenApiModule } from './openapi/openapi.module';

/**
 * Raiz da API Vethis. Rate limiting global (Blueprint §6); rotas de auth têm
 * limites próprios via @Throttle. Domínios (catalog, orders, enrollment,
 * secretaria, crm, analytics) entram nos próximos chunks do M1+.
 */
@Module({
  imports: [
    ConfigModule,
    DbModule,
    RedisModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    UsersModule,
    AuthModule,
    CatalogModule,
    CheckoutModule,
    MeModule,
    CrmModule,
    AdminModule,
    OpenApiModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
