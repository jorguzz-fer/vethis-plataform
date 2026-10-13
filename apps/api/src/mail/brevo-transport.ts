import { Logger } from '@nestjs/common';
import type { MailAddress, MailMessage, MailTransport } from './mail-transport';

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Adapter Brevo (ex-Sendinblue) via API transacional. Exige domínio do
 * remetente verificado no painel (SPF/DKIM) e a chave em `BREVO_API_KEY`.
 */
export class BrevoMailTransport implements MailTransport {
  readonly provider = 'brevo';
  private readonly logger = new Logger('Mail');

  constructor(private readonly apiKey: string) {}

  async send(message: MailMessage, from: MailAddress, replyTo?: MailAddress): Promise<void> {
    const res = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: from.email, name: from.name },
        to: [{ email: message.to.email, name: message.to.name }],
        replyTo: replyTo ? { email: replyTo.email, name: replyTo.name } : undefined,
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text,
      }),
    });
    if (!res.ok) {
      const body = (await res.text()).slice(0, 300);
      throw new Error(`Brevo ${res.status}: ${body}`);
    }
    this.logger.log(`Enviado para ${message.to.email}: "${message.subject}"`);
  }
}
