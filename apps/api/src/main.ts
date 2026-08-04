import 'reflect-metadata';
import { mkdirSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { Logger, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { APP_CONFIG, type AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: false });
  const config = app.get<AppConfig>(APP_CONFIG);

  // Segurança de borda (Blueprint §6).
  app.use(helmet());
  app.use(cookieParser(config.SESSION_SECRET));

  // Arquivos enviados pelo admin (capas etc.), servidos em /uploads. CORP
  // cross-origin para que o <img> do site (outro domínio) consiga carregar.
  // NÃO-FATAL: se o diretório não for gravável (volume ausente/sem permissão),
  // apenas registra aviso — a API precisa subir mesmo sem o upload disponível.
  try {
    mkdirSync(config.UPLOADS_DIR, { recursive: true });
    app.useStaticAssets(config.UPLOADS_DIR, {
      prefix: '/uploads/',
      setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
    });
  } catch (err) {
    new Logger('Bootstrap').warn(
      `Uploads desativados: não foi possível preparar UPLOADS_DIR="${config.UPLOADS_DIR}" (${(err as Error).message}). Configure um volume gravável para habilitar o upload de imagens.`,
    );
  }

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
