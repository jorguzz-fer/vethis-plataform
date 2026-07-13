import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../common/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SessionGuard } from '../auth/guards/session.guard';
import { CheckoutService } from './checkout.service';
import {
  createCheckoutSchema,
  paymentWebhookSchema,
  type CreateCheckoutDto,
  type OrderDto,
  type PaymentWebhookDto,
} from './dto';

/**
 * Checkout e pedidos. Comprar exige sessão (login antes do pagamento).
 * O webhook do gateway é público — a autenticidade vem do provedor (assinatura),
 * não da sessão do usuário.
 */
@Controller({ version: '1' })
export class CheckoutController {
  constructor(@Inject(CheckoutService) private readonly checkout: CheckoutService) {}

  @Post('checkout')
  @UseGuards(SessionGuard)
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createCheckoutSchema)) dto: CreateCheckoutDto,
  ): Promise<OrderDto> {
    return this.checkout.createCheckout(user, dto);
  }

  @Get('orders/:id')
  @UseGuards(SessionGuard)
  getOrder(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<OrderDto> {
    return this.checkout.getOrder(user, id);
  }

  /** Simula a confirmação do pagamento em dev (substitui o webhook do Asaas). */
  @Post('orders/:id/simulate-payment')
  @UseGuards(SessionGuard)
  simulate(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<OrderDto> {
    return this.checkout.simulatePayment(user, id);
  }

  @Post('webhooks/payments')
  webhook(
    @Body(new ZodValidationPipe(paymentWebhookSchema)) dto: PaymentWebhookDto,
  ): Promise<{ ok: true }> {
    return this.checkout.handleWebhook(dto);
  }
}
