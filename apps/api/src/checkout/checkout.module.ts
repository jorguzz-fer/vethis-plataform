import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { FakePaymentGateway } from './fake-gateway';
import { PAYMENT_GATEWAY } from './payment-gateway';

/**
 * Domínio de comércio (checkout → pagamento → matrícula). O gateway ativo é
 * escolhido por DI: hoje o adapter `fake`; o `asaas` entra pelo mesmo token
 * quando as credenciais forem contratadas (ADR 0004), sem tocar no serviço.
 */
@Module({
  imports: [AuthModule, UsersModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, { provide: PAYMENT_GATEWAY, useClass: FakePaymentGateway }],
})
export class CheckoutModule {}
