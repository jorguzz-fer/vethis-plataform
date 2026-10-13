import { Inject, Injectable, Logger } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/configuration';
import {
  MAIL_TRANSPORT,
  type MailAddress,
  type MailMessage,
  type MailTransport,
} from './mail-transport';
import type { MailBody } from './templates';

/**
 * Fachada de envio usada pelos domínios. `sendSafe` dispara em segundo plano e
 * NUNCA lança: e-mail é efeito secundário — jamais pode derrubar um registro
 * ou uma confirmação de pagamento. Falhas vão para o log.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly from: MailAddress;
  private readonly replyTo?: MailAddress;

  constructor(
    @Inject(MAIL_TRANSPORT) private readonly transport: MailTransport,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    this.from = {
      email: config.MAIL_FROM ?? 'nao-responda@localhost',
      name: config.MAIL_FROM_NAME,
    };
    this.replyTo = config.MAIL_REPLY_TO ? { email: config.MAIL_REPLY_TO } : undefined;
  }

  /** URL da área do aluno (para os links dos e-mails). */
  get alunoUrl(): string {
    return this.config.ALUNO_URL;
  }

  /** Destinatário dos avisos de venda para a equipe (opcional). */
  get salesNotifyEmail(): string | undefined {
    return this.config.SALES_NOTIFY_EMAIL;
  }

  sendSafe(to: MailAddress, body: MailBody): void {
    const message: MailMessage = { to, subject: body.subject, html: body.html, text: body.text };
    this.transport.send(message, this.from, this.replyTo).catch((err: unknown) => {
      this.logger.warn(
        `Falha ao enviar "${body.subject}" para ${to.email} via ${this.transport.provider}: ${String(err)}`,
      );
    });
  }
}
