import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserManagementRepository } from './usermanagement.repository';

@Injectable()
export class UsermanagementService {
  constructor(private readonly repository: UserManagementRepository) {}

  async list(actor: AuthenticatedUser, requestedOrganizationId?: string) {
    if (actor.role === 'PLATFORM_ADMIN') {
      const organizationId = requestedOrganizationId?.trim();
      if (!organizationId) {
        throw new BadRequestException(
          'organizationId is required when listing users as a platform admin.',
        );
      }

      if (!(await this.repository.organizationExists(organizationId))) {
        throw new NotFoundException('Organization not found.');
      }

      return this.repository.list(organizationId);
    }

    const organizationId = this.getOrganizationScope(actor);
    if (requestedOrganizationId && requestedOrganizationId !== organizationId) {
      throw new ForbiddenException(
        'You can only list users in your own organization.',
      );
    }

    return this.repository.list(organizationId);
  }

  async get(actor: AuthenticatedUser, userId: string) {
    const user = await this.repository.findById(
      userId,
      this.getOrganizationScope(actor),
    );

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async update(actor: AuthenticatedUser, userId: string, dto: UpdateUserDto) {
    if (
      dto.name === undefined &&
      dto.role === undefined &&
      dto.status === undefined
    ) {
      throw new BadRequestException('Provide at least one field to update.');
    }

    const scope = this.getOrganizationScope(actor);
    const target = await this.get(actor, userId);

    if (target.role === 'PLATFORM_ADMIN' && dto.role !== undefined) {
      throw new BadRequestException(
        'Platform administrator roles cannot be changed through user management.',
      );
    }

    if (
      actor.id === target.id &&
      (dto.role !== undefined ||
        (dto.status !== undefined && dto.status !== 'ACTIVE'))
    ) {
      throw new BadRequestException(
        'You cannot change your own role or deactivate your own account.',
      );
    }

    const data = {
      ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
      ...(dto.role === undefined ? {} : { role: dto.role }),
      ...(dto.status === undefined ? {} : { status: dto.status }),
    };

    if (data.name !== undefined && data.name.length < 2) {
      throw new BadRequestException('Name must contain at least 2 characters.');
    }

    const updated = await this.repository.update(userId, scope, data);

    if (!updated) {
      throw new NotFoundException('User not found.');
    }

    return updated;
  }

  async delete(actor: AuthenticatedUser, userId: string) {
    if (actor.id === userId) {
      throw new BadRequestException('You cannot delete your own account.');
    }

    let result: { count: number };
    try {
      result = await this.repository.delete(
        userId,
        this.getOrganizationScope(actor),
      );
    } catch (error) {
      if (this.isForeignKeyError(error)) {
        throw new ConflictException(
          'This user is referenced by other records and cannot be deleted.',
        );
      }
      throw error;
    }

    if (result.count !== 1) {
      throw new NotFoundException('User not found.');
    }

    return { message: 'User deleted successfully.' };
  }

  private getOrganizationScope(actor: AuthenticatedUser): string | null {
    if (actor.role === 'PLATFORM_ADMIN') {
      return null;
    }

    if (!actor.organizationId) {
      throw new ForbiddenException(
        'An organization membership is required to access users.',
      );
    }

    return actor.organizationId;
  }

  private isForeignKeyError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    );
  }
}
