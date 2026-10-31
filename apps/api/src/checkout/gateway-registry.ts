import { Logger } from '@nestjs/common';
import {
  PAYMENT_METHODS,
  gatewayForMethod,
  type AppConfig,
  type GatewayName,
} from '../config/configuration';
import { AsaasPaymentGateway } from './asaas-gateway';
import { FakePaymentGateway } from './fake-gateway';
import type { PaymentMethodDto } from './dto';
import type { PaymentGateway, PaymentGateways } from './payment-gateway';
import { StripePaymentGateway } from './stripe-gateway';

/**
 * Instancia só os adapters em uso (ex.: Stripe para cartão/Pix, Asaas para o
 * carnê) e resolve o gateway de cada meio. `byProvider` cobre também cobranças
 * antigas: um pedido Pix emitido no Asaas antes da troca continua sendo
 * reconciliado pelo Asaas enquanto as credenciais dele estiverem no ambiente.
 */
export function buildPaymentGateways(config: AppConfig): PaymentGateways {
  const logger = new Logger('PaymentGateways');
  const byName = new Map<GatewayName, PaymentGateway>();

  const make = (name: GatewayName): PaymentGateway => {
    const existing = byName.get(name);
    if (existing) return existing;
    let gw: PaymentGateway;
    if (name === 'stripe') {
      gw = new StripePaymentGateway(config);
    } else if (name === 'asaas') {
      if (config.NODE_ENV === 'production' && /sandbox/i.test(config.ASAAS_BASE_URL)) {
        logger.warn(
          'ATENÇÃO: NODE_ENV=production com ASAAS_BASE_URL de SANDBOX — as cobranças NÃO são reais. Em produção use https://api.asaas.com/v3 com a chave de produção.',
        );
      }
      gw = new AsaasPaymentGateway(config);
    } else {
      gw = new FakePaymentGateway();
    }
    byName.set(name, gw);
    return gw;
  };

  const routes = new Map<PaymentMethodDto, PaymentGateway>(
    PAYMENT_METHODS.map((m) => [m, make(gatewayForMethod(config, m))]),
  );

  // Asaas também fica disponível (só para webhooks/reconciliação de cobranças
  // já emitidas) quando a chave está configurada, mesmo sem atender meio algum.
  if (!byName.has('asaas') && config.ASAAS_API_KEY) make('asaas');

  logger.log(
    `Gateways de pagamento: ${PAYMENT_METHODS.map((m) => `${m}=${routes.get(m)!.provider}`).join(', ')}`,
  );

  return {
    forMethod: (method) => routes.get(method)!,
    byProvider: (provider) => [...byName.values()].find((g) => g.provider === provider),
    all: () => [...byName.values()],
  };
}
