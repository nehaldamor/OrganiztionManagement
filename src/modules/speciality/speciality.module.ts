import { Module } from '@nestjs/common';
import { SpecialityController } from './controllers/speciality.controller';
import { SpecialityService } from './services/speciality.service';
import { SpecialityRepository } from './repositories/speciality.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[AuthModule],
  controllers: [SpecialityController],
  providers: [SpecialityService,SpecialityRepository]
})
export class SpecialityModule {}
