import { Module } from '@nestjs/common';
import { TeammanagementController } from './controllers/teammanagement.controller';
import { TeammanagementService } from './services/teammanagement.service';
import { TeamRepository } from './repositories/teammanagement.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[AuthModule],
  controllers: [TeammanagementController],
  providers: [TeammanagementService,TeamRepository]
})
export class TeammanagementModule {}
