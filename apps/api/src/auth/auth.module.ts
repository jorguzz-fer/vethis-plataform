import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { SessionGuard } from './guards/session.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, SessionService, SessionGuard, RolesGuard],
  exports: [SessionService, SessionGuard, RolesGuard],
})
export class AuthModule {}
