import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CouponsAdminController } from './coupons.controller';
import { CouponsService } from './coupons.service';

/** Cupons de desconto: CRUD no backoffice; o checkout usa o serviço exportado. */
@Module({
  // SessionGuard depende de UsersService (mesmo arranjo do CheckoutModule).
  imports: [AuthModule, UsersModule],
  controllers: [CouponsAdminController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
