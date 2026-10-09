import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsermanagementController } from './usermanagement.controller';
import { UsermanagementService } from './usermanagement.service';
import { UserManagementRepository } from './usermanagement.repository';

@Module({
  imports: [AuthModule],
  controllers: [UsermanagementController],
  providers: [UsermanagementService, UserManagementRepository],
})
export class UsermanagementModule {}
