import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskStatusDto } from '../dto/update-task-status.dto';
import { TasksService } from '../services/tasks.service';

@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'MANAGER', 'EMPLOYEE')
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
  ) {
    return this.service.list(user, projectId);
  }

  @Post()
  @Roles('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'MANAGER')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.service.create(user, projectId, dto);
  }

  @Patch(':taskId/status')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.service.updateStatus(user, projectId, taskId, dto.status);
  }
}
