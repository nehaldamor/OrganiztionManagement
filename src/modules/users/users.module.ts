import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsermanagementController } from './controllers/users.controller';
import { UsermanagementService } from './services/users.service';
import { UserManagementRepository } from './repositories/users.repository';

@Module({
  imports: [AuthModule],
  controllers: [UsermanagementController],
  providers: [UsermanagementService, UserManagementRepository],
})
export class UsermanagementModule {}
