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
import { CreateSpecialityDto } from '../dto/create-speciality.dto';
import { UpdateSpecialityDto } from '../dto/update-speciality.dto';
import { SpecialityService } from '../services/speciality.service';

@Controller('speciality')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')
export class SpecialityController {
  constructor(private readonly specialityService: SpecialityService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSpecialityDto,
  ) {
    return this.specialityService.create(user, dto);
  }

  @Get()
  @Roles('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'MANAGER')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.specialityService.list(user, organizationId);
  }

  @Get(':id')
  get(@Param('id') id: string, @Query('organizationId') organizationId?: string) {
    return this.specialityService.get(id, organizationId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSpecialityDto,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.specialityService.update(id, dto, organizationId);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.specialityService.delete(id, organizationId);
  }
}
