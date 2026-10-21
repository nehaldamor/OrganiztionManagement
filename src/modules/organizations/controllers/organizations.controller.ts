import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { UpdateOrganizationStatusDto } from '../dto/update-organization-status.dto';
import { OrganizationService } from '../services/organizations.service';

@Controller('platform/organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationService.create(dto);
  }

  @Get()
  list(
    @Query('page') page = '1',
    @Query('limit') limit = '5',
  ) {
    return this.organizationService.list(page, limit);
  }
  
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles()
  @Get(':id')
  get(@Param('id') id: string) {
    return this.organizationService.get(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.organizationService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationStatusDto,
  ) {
    return this.organizationService.updateStatus(id, dto);
  }
}
