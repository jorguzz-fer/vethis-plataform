import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { APP_CONFIG, type AppConfig } from '../config/configuration';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { PaymentReconcilerService } from './payment-reconciler.service';
import { buildPaymentGateways } from './gateway-registry';
import { PAYMENT_GATEWAYS } from './payment-gateway';

/**
 * Domínio de comércio (checkout → pagamento → matrícula). Os gateways ativos
 * vêm de `PAYMENT_GATEWAY` (+ sobrescritas por meio): `fake` em dev; `stripe`
 * e/ou `asaas` em produção (ADR 0004) — sem tocar no serviço.
 */
@Module({
  imports: [AuthModule, UsersModule],
  controllers: [CheckoutController],
  providers: [
    CheckoutService,
    PaymentReconcilerService,
    {
      provide: PAYMENT_GATEWAYS,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => buildPaymentGateways(config),
    },
  ],
})
export class CheckoutModule {}
