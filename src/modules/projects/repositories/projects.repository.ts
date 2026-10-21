import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';

const projectInclude = {
  organization: { select: { id: true, name: true } },
  team: { select: { id: true, name: true, status: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ProjectInclude;

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ProjectCreateInput) {
    return this.prisma.project.create({ data, include: projectInclude });
  }
  findById(id: string, organizationId: string) {
    return this.prisma.project.findFirst({
      where: { id, organizationId },
      include: projectInclude,
    });
  }
  count(where: Prisma.ProjectWhereInput) {
    return this.prisma.project.count({ where });
  }
  list(where: Prisma.ProjectWhereInput, skip: number, take: number) {
    return this.prisma.project.findMany({
      where,
      skip,
      take,
      include: projectInclude,
      orderBy: { createdAt: 'desc' },
    });
  }
  update(id: string, organizationId: string, data: Prisma.ProjectUpdateInput) {
    return this.prisma.project
      .updateMany({ where: { id, organizationId }, data })
      .then(async (result) =>
        result.count ? this.findById(id, organizationId) : null,
      );
  }
  delete(id: string, organizationId: string) {
    return this.prisma.project.deleteMany({ where: { id, organizationId } });
  }
  teamBelongsToOrganization(teamId: string, organizationId: string) {
    return this.prisma.team.findFirst({
      where: { id: teamId, organizationId },
      select: { id: true, status: true },
    });
  }

  findIncompleteByTeam(
    teamId: string,
    organizationId: string,
    excludeProjectId?: string,
  ) {
    return this.prisma.project.findFirst({
      where: {
        teamId,
        organizationId,
        status: { not: 'COMPLETED' },
        ...(excludeProjectId ? { id: { not: excludeProjectId } } : {}),
      },
      select: { id: true, name: true, status: true },
    });
  }
}
