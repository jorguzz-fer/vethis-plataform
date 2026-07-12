import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { APP_CONFIG, type AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get<AppConfig>(APP_CONFIG);

  // Segurança de borda (Blueprint §6).
  app.use(helmet());
  app.use(cookieParser(config.SESSION_SECRET));

  // Versionamento por URI: rotas ficam sob /v1/... (contrato versionado).
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // CORS restrito aos fronts conhecidos; credenciais para cookie de sessão.
  const origins = config.CORS_ORIGINS
    ? config.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [config.APP_URL];
  app.enableCors({ origin: origins, credentials: true });

  app.enableShutdownHooks();

  await app.listen(config.API_PORT);
  new Logger('Bootstrap').log(`API Vethis ouvindo em http://localhost:${config.API_PORT}/v1`);
}

void bootstrap();
