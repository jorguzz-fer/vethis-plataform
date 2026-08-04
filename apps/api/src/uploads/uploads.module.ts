import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { UploadsController } from './uploads.controller';

/**
 * Upload de imagens do admin (capas etc.). Importa AuthModule (SessionService)
 * e UsersModule (UsersService) — ambos exigidos pelo SessionGuard, igual ao
 * AdminModule. Sem UsersModule, o SessionGuard não resolve e a API cai no boot.
 */
@Module({
  imports: [AuthModule, UsersModule],
  controllers: [UploadsController],
})
export class UploadsModule {}
