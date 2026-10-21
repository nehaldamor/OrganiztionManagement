import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.TaskInclude;

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProject(projectId: string, organizationId: string) {
    return this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true, teamId: true, status: true },
    });
  }

  findTeamMember(teamId: string, userId: string) {
    return this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
      select: { userId: true },
    });
  }

  list(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId },
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: Prisma.TaskCreateInput) {
    return this.prisma.task.create({ data, include: taskInclude });
  }

  updateStatus(
    id: string,
    projectId: string,
    status: 'TODO' | 'IN_PROGRESS' | 'DONE',
  ) {
    return this.prisma.task.updateMany({
      where: { id, projectId },
      data: { status },
    });
  }
}
