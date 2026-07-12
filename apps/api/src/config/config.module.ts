import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, loadConfig } from './configuration';

/**
 * Configuração global. Provê a config validada sob o token APP_CONFIG.
 * Injetar com `@Inject(APP_CONFIG) config: AppConfig`.
 */
@Global()
@Module({
  providers: [{ provide: APP_CONFIG, useFactory: () => loadConfig() }],
  exports: [APP_CONFIG],
})
export class ConfigModule {}
