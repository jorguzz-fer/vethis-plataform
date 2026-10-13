/** Destinatário/remetente de e-mail. */
export interface MailAddress {
  email: string;
  name?: string;
}

/** Mensagem já renderizada (assunto + HTML + texto alternativo). */
export interface MailMessage {
  to: MailAddress;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Port de envio de e-mail transacional (mesmo padrão do PaymentGateway, ADR
 * 0004): o domínio só conhece esta interface; o adapter (log em dev, Brevo em
 * produção) é escolhido por DI a partir de `MAIL_PROVIDER`.
 */
export interface MailTransport {
  readonly provider: string;
  send(message: MailMessage, from: MailAddress, replyTo?: MailAddress): Promise<void>;
}

export const MAIL_TRANSPORT = 'MAIL_TRANSPORT';
