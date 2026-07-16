import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Ip,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../common/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SessionGuard } from '../auth/guards/session.guard';
import { CheckoutService } from './checkout.service';
import {
  asaasWebhookSchema,
  createCheckoutSchema,
  paymentWebhookSchema,
  type AsaasWebhookDto,
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
    @Ip() ip: string,
  ): Promise<OrderDto> {
    return this.checkout.createCheckout(user, dto, ip);
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

  /** Webhook do Asaas. Autenticidade pelo header `asaas-access-token`. */
  @Post('webhooks/asaas')
  @HttpCode(200)
  webhookAsaas(
    @Headers('asaas-access-token') token: string | undefined,
    @Body(new ZodValidationPipe(asaasWebhookSchema)) dto: AsaasWebhookDto,
  ): Promise<{ ok: true }> {
    return this.checkout.handleAsaasWebhook(token, dto);
  }
}
