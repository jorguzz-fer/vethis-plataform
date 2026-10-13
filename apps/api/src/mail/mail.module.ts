import { Global, Logger, Module } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/configuration';
import { BrevoMailTransport } from './brevo-transport';
import { LogMailTransport } from './log-transport';
import { MAIL_TRANSPORT, type MailTransport } from './mail-transport';
import { MailerService } from './mailer.service';

/**
 * E-mails transacionais. Global: qualquer domínio injeta `MailerService`.
 * O transporte é escolhido por `MAIL_PROVIDER` (`log` em dev, `brevo` em prod).
 */
@Global()
@Module({
  providers: [
    {
      provide: MAIL_TRANSPORT,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): MailTransport => {
        const logger = new Logger('MailModule');
        if (config.MAIL_PROVIDER === 'brevo') {
          logger.log(`E-mail: brevo (remetente ${config.MAIL_FROM})`);
          return new BrevoMailTransport(config.BREVO_API_KEY!);
        }
        if (config.NODE_ENV === 'production') {
          logger.warn('MAIL_PROVIDER=log em produção: NENHUM e-mail transacional será enviado.');
        }
        return new LogMailTransport();
      },
    },
    MailerService,
  ],
  exports: [MailerService],
})
export class MailModule {}
