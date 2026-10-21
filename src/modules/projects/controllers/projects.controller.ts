import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { UpdateProjectStatusDto } from '../dto/update-project-status.dto';
import { ProjectsService } from '../services/projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'MANAGER', 'EMPLOYEE')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}
  @Post() @Roles('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'MANAGER') create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProjectDto,
  ) {
    return this.service.create(user, dto);
  }
  @Get() list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('organizationId') organizationId?: string,
    @Query('teamId') teamId?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.list(user, organizationId, teamId, status, page, limit);
  }
  @Get(':id') get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.service.get(user, id, organizationId);
  }
  @Patch(':id')
  @Roles('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'MANAGER')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.service.update(user, id, dto, organizationId);
  }
  @Patch(':id/status')
  @Roles('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'MANAGER')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectStatusDto,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.service.update(
      user,
      id,
      { status: dto.status },
      organizationId,
    );
  }
  @Delete(':id')
  @Roles('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'MANAGER')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.service.remove(user, id, organizationId);
  }
}
