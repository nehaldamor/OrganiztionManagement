import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TeammanagementService } from '../services/teammanagement.service';
import { CreateTeamDto } from '../dto/create-team.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { UpdateTeamDto } from '../dto/update-team.dto';
import { UpdateTeamStatusDto } from '../dto/update-team-status.dto';
import { AddTeamMemberDto } from '../dto/add-team-member.dto';

@Controller('team')       
export class TeammanagementController {
  constructor(private readonly teamService:TeammanagementService){}

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('PLATFORM_ADMIN','ORGANIZATION_ADMIN','MANAGER','EMPLOYEE')
  @Get()
  listTeams(@CurrentUser() user: AuthenticatedUser,@Query('organizationId') organizationId?: string){
    return this.teamService.listTeams(user, organizationId);
  }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('PLATFORM_ADMIN','ORGANIZATION_ADMIN','MANAGER','EMPLOYEE')
  @Get(':id')
  getTeam(@CurrentUser() user: AuthenticatedUser,@Param('id') teamId: string){
    return this.teamService.getTeam(user, teamId);
  }
    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles('PLATFORM_ADMIN','ORGANIZATION_ADMIN','MANAGER')
    @Post()
  async createTeam(@CurrentUser() user: AuthenticatedUser,@Body() createTeamdto:CreateTeamDto){
    return await this.teamService.createTeamSevice(user,createTeamdto);
  }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('PLATFORM_ADMIN','ORGANIZATION_ADMIN','MANAGER')
  @Patch(':id')
  updateTeam(@CurrentUser() user: AuthenticatedUser,@Param('id') teamId: string,@Body() dto: UpdateTeamDto){ return this.teamService.updateTeam(user, teamId, dto); }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('PLATFORM_ADMIN','ORGANIZATION_ADMIN','MANAGER')
  @Patch(':id/status')
  updateTeamStatus(@CurrentUser() user: AuthenticatedUser,@Param('id') teamId: string,@Body() dto: UpdateTeamStatusDto){ return this.teamService.updateTeamStatus(user, teamId, dto.status); }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('PLATFORM_ADMIN','ORGANIZATION_ADMIN','MANAGER')
  @Delete(':id')
  deleteTeam(@CurrentUser() user: AuthenticatedUser,@Param('id') teamId: string){ return this.teamService.deleteTeam(user, teamId); }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('PLATFORM_ADMIN','ORGANIZATION_ADMIN','MANAGER','EMPLOYEE')
  @Get(':id/members')
  listMembers(@CurrentUser() user: AuthenticatedUser,@Param('id') teamId: string){ return this.teamService.listMembers(user, teamId); }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('PLATFORM_ADMIN','ORGANIZATION_ADMIN','MANAGER')
  @Post(':id/members')
  addMember(@CurrentUser() user: AuthenticatedUser,@Param('id') teamId: string,@Body() dto: AddTeamMemberDto){ return this.teamService.addMember(user, teamId, dto.userId); }
  
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('PLATFORM_ADMIN','ORGANIZATION_ADMIN','MANAGER')
  @Delete(':id/members/:userId')
  removeMember(@CurrentUser() user: AuthenticatedUser,@Param('id') teamId: string,@Param('userId') userId: string){ return this.teamService.removeMember(user, teamId, userId); }
}
