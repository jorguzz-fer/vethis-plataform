import { Logger } from '@nestjs/common';
import type { MailAddress, MailMessage, MailTransport } from './mail-transport';

/** Adapter de desenvolvimento: só registra no log, nada sai da máquina. */
export class LogMailTransport implements MailTransport {
  readonly provider = 'log';
  private readonly logger = new Logger('Mail');

  async send(message: MailMessage, from: MailAddress): Promise<void> {
    this.logger.log(
      `[não enviado — MAIL_PROVIDER=log] de ${from.email} para ${message.to.email}: "${message.subject}"`,
    );
  }
}
