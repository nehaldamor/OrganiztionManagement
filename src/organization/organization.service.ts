import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateOrganizationStatusDto } from './dto/update-organization-status.dto';
import { OrganizationRepository } from './organization.repository';

@Injectable()
export class OrganizationService {
  constructor(private readonly repository: OrganizationRepository) {}

  async create(dto: CreateOrganizationDto) {
    const name = dto.name.trim();
    const slug = this.normalizeSlug(dto.slug ?? name);

    if (name.length < 2 || !slug) {
      throw new BadRequestException(
        'A valid organization name or slug is required.',
      );
    }

    try {
      return await this.repository.create({ name, slug });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'An organization with this slug already exists.',
        );
      }
      throw error;
    }
  }

  async list(page = '1', limit = '5') {
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      throw new BadRequestException('Page must be a positive integer.');
    }

    if (!Number.isInteger(limitNumber) || limitNumber < 1) {
      throw new BadRequestException('Limit must be a positive integer.');
    }

    const safeLimit = Math.min(limitNumber, 100);
    const skip = (pageNumber - 1) * safeLimit;

    const [organizations, totalItems] = await Promise.all([
      this.repository.listPaginated(skip, safeLimit),
      this.repository.count(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / safeLimit));
    const meta = {
      page: pageNumber,
      limit: safeLimit,
      totalItems,
      totalPages,
      hasNextPage: pageNumber < totalPages,
      hasPreviousPage: pageNumber > 1,
    };

    return {
      organizations,
      data: organizations,
      meta,
      pagination: meta,
    };
  }

  async get(id: string) {
    const organization = await this.repository.findById(id);
    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }
    return organization;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.get(id);

    const data = {
      ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
      ...(dto.slug === undefined ? {} : { slug: this.normalizeSlug(dto.slug) }),
    };

    if (data.name === '' || data.name?.length === 1 || data.slug === '') {
      throw new BadRequestException(
        'A valid organization name and slug are required.',
      );
    }

    try {
      return await this.repository.update(id, data);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'An organization with this slug already exists.',
        );
      }
      throw error;
    }
  }

  async updateStatus(id: string, dto: UpdateOrganizationStatusDto) {
    await this.get(id);
    return this.repository.update(id, { status: dto.status });
  }

  private normalizeSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private isUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
