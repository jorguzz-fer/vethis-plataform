import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CrmModule } from '../crm/crm.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, UsersModule, CrmModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
