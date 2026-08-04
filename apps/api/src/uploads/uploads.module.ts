import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UploadsController } from './uploads.controller';

/** Upload de imagens do admin (capas etc.). Guards vêm do AuthModule. */
@Module({
  imports: [AuthModule],
  controllers: [UploadsController],
})
export class UploadsModule {}
