import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { CreateTaskDto } from '../dto/create-task.dto';
import { TasksRepository } from '../repositories/tasks.repository';

@Injectable()
export class TasksService {
  constructor(private readonly repository: TasksRepository) {}

  private organization(actor: AuthenticatedUser) {
    if (!actor.organizationId && actor.role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('An organization membership is required.');
    }
    return actor.organizationId;
  }

  async list(actor: AuthenticatedUser, projectId: string) {
    const project = await this.repository.findProject(
      projectId,
      this.organization(actor) ?? '',
    );
    if (!project) throw new NotFoundException('Project not found.');
    return this.repository.list(projectId);
  }

  async create(
    actor: AuthenticatedUser,
    projectId: string,
    dto: CreateTaskDto,
  ) {
    const project = await this.repository.findProject(
      projectId,
      this.organization(actor) ?? '',
    );
    if (!project) throw new NotFoundException('Project not found.');
    if (project.status === 'COMPLETED')
      throw new BadRequestException(
        'Tasks cannot be assigned to a completed project.',
      );
    if (
      !(await this.repository.findTeamMember(project.teamId, dto.assigneeId))
    ) {
      throw new BadRequestException(
        'The assignee must be a member of the project team.',
      );
    }
    return this.repository.create({
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      project: { connect: { id: projectId } },
      assignee: { connect: { id: dto.assigneeId } },
      createdBy: { connect: { id: actor.id } },
    });
  }

  async updateStatus(
    actor: AuthenticatedUser,
    projectId: string,
    taskId: string,
    status: 'TODO' | 'IN_PROGRESS' | 'DONE',
  ) {
    await this.list(actor, projectId);
    const result = await this.repository.updateStatus(
      taskId,
      projectId,
      status,
    );
    if (!result.count) throw new NotFoundException('Task not found.');
    return { id: taskId, status };
  }
}
