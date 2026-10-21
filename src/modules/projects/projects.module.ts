import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsController } from './controllers/projects.controller';
import { ProjectsRepository } from './repositories/projects.repository';
import { ProjectsService } from './services/projects.service';
import { TasksController } from './controllers/tasks.controller';
import { TasksRepository } from './repositories/tasks.repository';
import { TasksService } from './services/tasks.service';

@Module({
  imports: [AuthModule],
  controllers: [ProjectsController, TasksController],
  providers: [
    ProjectsService,
    ProjectsRepository,
    TasksService,
    TasksRepository,
  ],
})
export class ProjectsModule {}
