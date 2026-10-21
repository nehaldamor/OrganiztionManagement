import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { CreateSpecialityDto } from '../dto/create-speciality.dto';
import { UpdateSpecialityDto } from '../dto/update-speciality.dto';
import { SpecialityRepository } from '../repositories/speciality.repository';

@Injectable()
export class SpecialityService {
  constructor(private readonly repository: SpecialityRepository) {}

  async create(actor: AuthenticatedUser, dto: CreateSpecialityDto) {
    const organizationId = this.normalizeId(dto.organizationId, 'Organization ID');
    const name = this.normalizeName(dto.name);
    const code = this.normalizeCode(dto.code);
    const description = this.normalizeDescription(dto.description);

    if (!organizationId) {
      throw new BadRequestException('Organization ID is required.');
    }

    if (
      actor.role !== 'PLATFORM_ADMIN' &&
      (!actor.organizationId || actor.organizationId !== organizationId)
    ) {
      throw new ForbiddenException(
        'You can only create specialities in your own organization.',
      );
    }

    try {
      return await this.repository.create({
        organizationId,
        name,
        code,
        description,
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'A speciality with this code already exists for the selected organization.',
        );
      }

      if (this.isForeignKeyConstraintError(error)) {
        throw new BadRequestException(
          'The provided organization does not exist.',
        );
      }

      throw error;
    }
  }

  async list(actor: AuthenticatedUser, organizationId?: string) {
    const requestedOrganizationId = this.normalizeId(organizationId);

    if (actor.role === 'PLATFORM_ADMIN') {
      return this.repository.list(requestedOrganizationId);
    }

    if (!actor.organizationId) {
      throw new ForbiddenException(
        'An organization membership is required to list specialities.',
      );
    }

    if (
      requestedOrganizationId &&
      requestedOrganizationId !== actor.organizationId
    ) {
      throw new ForbiddenException(
        'You can only list specialities in your own organization.',
      );
    }

    return this.repository.list(actor.organizationId);
  }

  async get(id: string, organizationId?: string) {
    const speciality = await this.repository.findById(
      id,
      this.normalizeId(organizationId),
    );

    if (!speciality) {
      throw new NotFoundException('Speciality not found.');
    }

    return speciality;
  }

  async update(id: string, dto: UpdateSpecialityDto, organizationId?: string) {
    const resolvedOrganizationId = this.normalizeId(organizationId);
    await this.get(id, resolvedOrganizationId);

    const data: {
      name?: string;
      code?: string;
      description?: string | null;
    } = {};

    if (dto.name !== undefined) {
      data.name = this.normalizeName(dto.name);
    }

    if (dto.code !== undefined) {
      data.code = this.normalizeCode(dto.code);
    }

    if (dto.description !== undefined) {
      data.description = this.normalizeDescription(dto.description);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'At least one valid field is required to update the speciality.',
      );
    }

    try {
      const result = await this.repository.update(id, resolvedOrganizationId, data);

      if (!result) {
        throw new NotFoundException('Speciality not found.');
      }

      return result;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'A speciality with this code already exists for the selected organization.',
        );
      }

      if (this.isForeignKeyConstraintError(error)) {
        throw new BadRequestException(
          'The provided organization does not exist.',
        );
      }

      throw error;
    }
  }

  async delete(id: string, organizationId?: string) {
    const deleted = await this.repository.delete(
      id,
      this.normalizeId(organizationId),
    );

    if (deleted.count !== 1) {
      throw new NotFoundException('Speciality not found.');
    }

    return { id, deleted: true };
  }

  private normalizeId(value?: string, label = 'ID') {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeName(value: string) {
    const normalized = value.trim();

    if (!normalized) {
      throw new BadRequestException('Speciality name is required.');
    }

    return normalized;
  }

  private normalizeCode(value: string) {
    const normalized = value.trim().toUpperCase().replace(/\s+/g, '');

    if (!normalized) {
      throw new BadRequestException('Speciality code is required.');
    }

    return normalized;
  }

  private normalizeDescription(value?: string | null) {
    if (value === undefined || value === null) {
      return null;
    }

    const description = value.trim();
    return description.length > 0 ? description : null;
  }

  private isUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private isForeignKeyConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2003' || error.code === 'P2025')
    );
  }
}
