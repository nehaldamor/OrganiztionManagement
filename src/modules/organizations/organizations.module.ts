import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganizationController } from './controllers/organizations.controller';
import { OrganizationRepository } from './repositories/organizations.repository';
import { OrganizationService } from './services/organizations.service';

@Module({
  imports: [AuthModule],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationRepository],
})
export class OrganizationModule {}
