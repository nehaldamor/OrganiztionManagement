import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsermanagementService } from './usermanagement.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsermanagementController {
  constructor(private readonly userService: UsermanagementService) {}

  @Get()
  list(
    @CurrentUser() actor: AuthenticatedUser,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.userService.list(actor, organizationId);
  }

  @Get(':id')
  get(@CurrentUser() actor: AuthenticatedUser, @Param('id') userId: string) {
    return this.userService.get(actor, userId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(actor, userId, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')
  delete(@CurrentUser() actor: AuthenticatedUser, @Param('id') userId: string) {
    return this.userService.delete(actor, userId);
  }
}
