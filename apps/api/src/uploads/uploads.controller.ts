import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  BadRequestException,
  Controller,
  Inject,
  Post,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SessionGuard } from '../auth/guards/session.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { APP_CONFIG, type AppConfig } from '../config/configuration';

/** Arquivo recebido do multer (memoryStorage) — tipado localmente. */
interface UploadedImage {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Tipos de imagem aceitos → extensão gravada. */
const ALLOWED = new Map<string, string>([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
]);
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Upload de imagens do admin (capas de curso etc.). Grava no volume persistente
 * (UPLOADS_DIR) e devolve a URL pública, servida pela API em /uploads.
 */
@Controller({ path: 'admin/uploads', version: '1' })
@UseGuards(SessionGuard, RolesGuard)
@Roles('staff', 'admin')
export class UploadsController {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async upload(@UploadedFile() file?: UploadedImage): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('Arquivo ausente (campo "file").');
    const ext = ALLOWED.get(file.mimetype);
    if (!ext) throw new UnsupportedMediaTypeException('Formato inválido — envie PNG, JPG ou WEBP.');

    const name = `${randomUUID()}${ext}`;
    await writeFile(join(this.config.UPLOADS_DIR, name), file.buffer);

    const base = this.config.PUBLIC_API_URL.replace(/\/+$/, '');
    return { url: `${base}/uploads/${name}` };
  }
}
