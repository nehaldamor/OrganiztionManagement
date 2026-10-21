import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectsRepository } from '../repositories/projects.repository';

@Injectable()
export class ProjectsService {
  constructor(private readonly repository: ProjectsRepository) {}

  async create(actor: AuthenticatedUser, dto: CreateProjectDto) {
    const organizationId = this.resolveOrganization(actor, dto.organizationId);
    const name = this.clean(dto.name);
    const teamId = this.clean(dto.teamId);
    this.validateDates(dto.startDate, dto.dueDate);
    if (!name || !teamId)
      throw new BadRequestException('Project name and team ID are required.');
    const team = await this.repository.teamBelongsToOrganization(
      teamId,
      organizationId,
    );
    if (!team)
      throw new BadRequestException(
        'The team does not belong to the selected organization.',
      );
    if (team.status !== 'ACTIVE')
      throw new ConflictException(
        'Projects can only be assigned to active teams.',
      );
    await this.assertTeamAvailable(teamId, organizationId);
    try {
      return await this.repository.create({
        name,
        description: this.cleanNullable(dto.description),
        organization: { connect: { id: organizationId } },
        team: { connect: { id: teamId } },
        createdBy: { connect: { id: actor.id } },
        startDate: this.date(dto.startDate),
        dueDate: this.date(dto.dueDate),
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async list(
    actor: AuthenticatedUser,
    organizationId?: string,
    teamId?: string,
    status?: string,
    page = '1',
    limit = '20',
  ) {
    const organization = this.resolveOrganization(actor, organizationId, true);
    const pageNumber = this.positiveInteger(page, 'Page');
    const safeLimit = Math.min(this.positiveInteger(limit, 'Limit'), 100);
    if (
      status &&
      !['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].includes(
        status,
      )
    )
      throw new BadRequestException('Invalid project status.');
    const where: Prisma.ProjectWhereInput = {
      organizationId: organization,
      ...(teamId ? { teamId } : {}),
      ...(status ? { status: status as never } : {}),
    };
    const [projects, totalItems] = await Promise.all([
      this.repository.list(where, (pageNumber - 1) * safeLimit, safeLimit),
      this.repository.count(where),
    ]);
    const totalPages = Math.max(1, Math.ceil(totalItems / safeLimit));
    return {
      projects,
      data: projects,
      meta: {
        page: pageNumber,
        limit: safeLimit,
        totalItems,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },
    };
  }

  async get(actor: AuthenticatedUser, id: string, organizationId?: string) {
    return (
      this.repository.findById(
        id,
        this.resolveOrganization(actor, organizationId, true),
      ) ?? Promise.reject(new NotFoundException('Project not found.'))
    );
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateProjectDto,
    organizationId?: string,
  ) {
    const organization = this.resolveOrganization(actor, organizationId, true);
    const existing = await this.repository.findById(id, organization);
    if (!existing) throw new NotFoundException('Project not found.');
    if (dto.teamId) {
      const team = await this.repository.teamBelongsToOrganization(
        dto.teamId,
        organization,
      );
      if (!team)
        throw new BadRequestException(
          'The team does not belong to the project organization.',
        );
      if (team.status !== 'ACTIVE')
        throw new ConflictException(
          'Projects can only be assigned to active teams.',
        );
    }
    const requestedTeamId = dto.teamId ?? existing.teamId;
    const requestedStatus = dto.status ?? existing.status;
    if (requestedStatus !== 'COMPLETED' && existing.status === 'COMPLETED') {
      const team = await this.repository.teamBelongsToOrganization(
        requestedTeamId,
        organization,
      );
      if (!team)
        throw new BadRequestException(
          'The team does not belong to the project organization.',
        );
      if (team.status !== 'ACTIVE')
        throw new ConflictException(
          'Projects can only be active on active teams.',
        );
    }
    if (requestedStatus !== 'COMPLETED') {
      await this.assertTeamAvailable(requestedTeamId, organization, id);
    }
    this.validateDates(
      dto.startDate,
      dto.dueDate,
      existing.startDate,
      existing.dueDate,
    );
    try {
      const result = await this.repository.update(id, organization, {
        ...(dto.name !== undefined ? { name: this.clean(dto.name) } : {}),
        ...(dto.description !== undefined
          ? { description: this.cleanNullable(dto.description) }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.teamId !== undefined
          ? { team: { connect: { id: dto.teamId } } }
          : {}),
        ...(dto.startDate !== undefined
          ? { startDate: this.date(dto.startDate) }
          : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: this.date(dto.dueDate) }
          : {}),
      });
      if (!result) throw new NotFoundException('Project not found.');
      return result;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(actor: AuthenticatedUser, id: string, organizationId?: string) {
    const organization = this.resolveOrganization(actor, organizationId, true);
    const result = await this.repository.delete(id, organization);
    if (!result.count) throw new NotFoundException('Project not found.');
    return { id, deleted: true };
  }

  private resolveOrganization(
    actor: AuthenticatedUser,
    requested?: string,
    allowImplicit = false,
  ) {
    const id =
      actor.role === 'PLATFORM_ADMIN'
        ? this.clean(requested)
        : actor.organizationId;
    if (actor.role === 'PLATFORM_ADMIN' && !id)
      throw new BadRequestException(
        'Organization ID is required for a platform administrator.',
      );
    if (
      actor.role !== 'PLATFORM_ADMIN' &&
      requested &&
      requested !== actor.organizationId
    )
      throw new ForbiddenException(
        'You can only access projects in your own organization.',
      );
    if (!id && !allowImplicit)
      throw new ForbiddenException('An organization membership is required.');
    if (!id)
      throw new ForbiddenException('An organization membership is required.');
    return id;
  }
  private clean(value?: string | null) {
    return value?.trim() ?? '';
  }
  private async assertTeamAvailable(
    teamId: string,
    organizationId: string,
    excludeProjectId?: string,
  ) {
    const incompleteProject = await this.repository.findIncompleteByTeam(
      teamId,
      organizationId,
      excludeProjectId,
    );
    if (incompleteProject) {
      throw new ConflictException(
        `This team already has an incomplete project: ${incompleteProject.name}. Complete it before assigning the team to another project.`,
      );
    }
  }
  private cleanNullable(value?: string | null) {
    const clean = this.clean(value);
    return clean || null;
  }
  private date(value?: string | null) {
    return value ? new Date(value) : null;
  }
  private validateDates(
    start?: string | null,
    due?: string | null,
    existingStart?: Date | null,
    existingDue?: Date | null,
  ) {
    const s = start === undefined ? existingStart : this.date(start);
    const d = due === undefined ? existingDue : this.date(due);
    if (s && d && s > d)
      throw new BadRequestException(
        'Due date must be on or after the start date.',
      );
  }
  private positiveInteger(value: string, label: string) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1)
      throw new BadRequestException(`${label} must be a positive integer.`);
    return n;
  }
  private handleDatabaseError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new ConflictException(
        'A project with this name already exists in the organization.',
      );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    )
      throw new BadRequestException('A referenced record does not exist.');
    throw error;
  }
}
