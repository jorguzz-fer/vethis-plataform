import { Logger, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { APP_CONFIG, type AppConfig } from '../config/configuration';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { FakePaymentGateway } from './fake-gateway';
import { AsaasPaymentGateway } from './asaas-gateway';
import { PAYMENT_GATEWAY, type PaymentGateway } from './payment-gateway';

/**
 * Domínio de comércio (checkout → pagamento → matrícula). O gateway ativo é
 * escolhido por DI a partir de `PAYMENT_GATEWAY`: `fake` em dev, `asaas` quando
 * as credenciais estão no ambiente (ADR 0004) — sem tocar no serviço.
 */
@Module({
  imports: [AuthModule, UsersModule],
  controllers: [CheckoutController],
  providers: [
    CheckoutService,
    {
      provide: PAYMENT_GATEWAY,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): PaymentGateway => {
        if (config.PAYMENT_GATEWAY === 'asaas') {
          const logger = new Logger('CheckoutModule');
          logger.log(`Gateway de pagamento: asaas (${config.ASAAS_BASE_URL})`);
          if (config.NODE_ENV === 'production' && /sandbox/i.test(config.ASAAS_BASE_URL)) {
            logger.warn(
              'ATENÇÃO: NODE_ENV=production com ASAAS_BASE_URL de SANDBOX — as cobranças NÃO são reais. Em produção use https://api.asaas.com/v3 com a chave de produção.',
            );
          }
          return new AsaasPaymentGateway(config);
        }
        return new FakePaymentGateway();
      },
    },
  ],
})
export class CheckoutModule {}
