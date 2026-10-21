import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TeamRepository } from '../repositories/teammanagement.repository';
import { CreateTeamDto } from '../dto/create-team.dto';
import { AuthenticatedUser } from '../../auth/auth.types';
import { UpdateTeamDto } from '../dto/update-team.dto';

@Injectable()
export class TeammanagementService {
    constructor(private readonly repository: TeamRepository) { }

    async createTeamSevice(actor: AuthenticatedUser, data: CreateTeamDto) {

        if (actor.role !== 'PLATFORM_ADMIN' && actor.organizationId !== data.organizationId) {
            throw new ConflictException("You can only create teams in your own organization.")
        }

        const team = await this.repository.findTeam(data.name, data.organizationId);
        if (team) {
            throw new ConflictException("team with this name already exist")
        }

        const newTeam = await this.repository.createTeam(data);
        return newTeam;

    }

    private organizationFor(actor: AuthenticatedUser, requested?: string) {
        const organizationId = actor.role === 'PLATFORM_ADMIN' ? requested : actor.organizationId;
        if (!organizationId) throw new ConflictException('Organization ID is required.');
        return organizationId;
    }

    async listTeams(actor: AuthenticatedUser, requested?: string) {
        return this.repository.listTeams(this.organizationFor(actor, requested));
    }

    private async getOwnedTeam(actor: AuthenticatedUser, teamId: string) {
        const team = await this.repository.findById(teamId, this.organizationFor(actor));
        if (!team) throw new NotFoundException('Team not found.');
        return team;
    }

    async getTeam(actor: AuthenticatedUser, teamId: string) {
        return this.getOwnedTeam(actor, teamId);
    }

    async updateTeam(actor: AuthenticatedUser, teamId: string, data: UpdateTeamDto) {
        const team = await this.getOwnedTeam(actor, teamId);
        if (data.name && data.name !== team.name && await this.repository.findTeam(data.name, team.organizationId)) throw new ConflictException('A team with this name already exists.');
        return this.repository.update(teamId, data);
    }

    async updateTeamStatus(actor: AuthenticatedUser, teamId: string, status: 'ACTIVE' | 'INACTIVE') {
        await this.getOwnedTeam(actor, teamId); return this.repository.updateStatus(teamId, status);
    }

    async deleteTeam(actor: AuthenticatedUser, teamId: string) {
        await this.getOwnedTeam(actor, teamId); await this.repository.delete(teamId); return { message: 'Team deleted successfully.' };
    }

    async listMembers(actor: AuthenticatedUser, teamId: string) {
        await this.getOwnedTeam(actor, teamId); return this.repository.listMembers(teamId);
    }
    
    async addMember(actor: AuthenticatedUser, teamId: string, userId: string) {
        const team = await this.getOwnedTeam(actor, teamId);
        if (!await this.repository.findUser(userId, team.organizationId)) throw new NotFoundException('User not found in this organization.');
        if (await this.repository.findMember(teamId, userId)) throw new ConflictException('User is already a member of this team.');
        const existingTeam = await this.repository.findUserTeam(userId);
        if (existingTeam) throw new ConflictException(`User already belongs to the ${existingTeam.team.name} team.`);
        return this.repository.createMember(teamId, userId, team.organizationId);
    }
    async removeMember(actor: AuthenticatedUser, teamId: string, userId: string) {
        await this.getOwnedTeam(actor, teamId); if (!await this.repository.findMember(teamId, userId)) throw new NotFoundException('Team member not found.'); await this.repository.deleteMember(teamId, userId); return { message: 'Team member removed successfully.' };
    }
}
