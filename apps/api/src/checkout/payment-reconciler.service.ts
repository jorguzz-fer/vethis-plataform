import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/configuration';
import { CheckoutService } from './checkout.service';
import { PAYMENT_GATEWAY, type PaymentGateway } from './payment-gateway';

/**
 * Reconciliação periódica de pagamentos: consulta no provedor os pedidos ainda
 * pendentes e confirma os que já foram pagos. Cobre webhook não cadastrado,
 * fila pausada ou API fora do ar na hora do evento. Primeira rodada logo após o
 * boot (pega o que ficou para trás durante um deploy); depois a cada
 * `PAYMENT_RECONCILE_INTERVAL_SEC` (0 desliga). Não roda com o gateway fake.
 */
@Injectable()
export class PaymentReconcilerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentReconcilerService.name);
  private timer?: NodeJS.Timeout;
  private kickoff?: NodeJS.Timeout;
  private running = false;

  constructor(
    @Inject(CheckoutService) private readonly checkout: CheckoutService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  onModuleInit(): void {
    const seconds = this.config.PAYMENT_RECONCILE_INTERVAL_SEC;
    if (seconds <= 0 || this.gateway.simulatable) return;
    this.logger.log(`Reconciliação de pagamentos a cada ${seconds}s (${this.gateway.provider}).`);
    this.kickoff = setTimeout(() => void this.run(), 20_000);
    this.kickoff.unref();
    this.timer = setInterval(() => void this.run(), seconds * 1000);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.kickoff) clearTimeout(this.kickoff);
    if (this.timer) clearInterval(this.timer);
  }

  /** Uma rodada; nunca sobrepõe outra em andamento. */
  async run(): Promise<{ checked: number; confirmed: number }> {
    if (this.running) return { checked: 0, confirmed: 0 };
    this.running = true;
    try {
      const result = await this.checkout.reconcilePendingPayments();
      if (result.confirmed > 0) {
        this.logger.log(
          `Reconciliação: ${result.confirmed} pedido(s) confirmado(s) de ${result.checked} pendente(s).`,
        );
      }
      return result;
    } catch (err) {
      this.logger.warn(`Reconciliação falhou: ${String(err)}`);
      return { checked: 0, confirmed: 0 };
    } finally {
      this.running = false;
    }
  }
}
