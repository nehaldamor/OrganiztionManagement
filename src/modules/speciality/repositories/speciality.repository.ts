import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SpecialityRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    organizationId: string;
    name: string;
    code: string;
    description?: string | null;
  }) {
    return this.prisma.speciality.create({
      data,
      include: {
        organization: {
          select: { id: true, name: true },
        },
        _count: {
          select: { users: true },
        },
      },
    });
  }

  list(organizationId?: string) {
    return this.prisma.speciality.findMany({
      where: organizationId ? { organizationId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        _count: {
          select: { users: true },
        },
      },
    });
  }

  findById(id: string, organizationId?: string) {
    return this.prisma.speciality.findFirst({
      where: {
        id,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        _count: {
          select: { users: true },
        },
      },
    });
  }

  update(
    id: string,
    organizationId: string | undefined,
    data: {
      name?: string;
      code?: string;
      description?: string | null;
    },
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.speciality.updateMany({
        where: {
          id,
          ...(organizationId ? { organizationId } : {}),
        },
        data,
      });

      if (result.count !== 1) {
        return null;
      }

      return transaction.speciality.findFirst({
        where: {
          id,
          ...(organizationId ? { organizationId } : {}),
        },
        include: {
          organization: {
            select: { id: true, name: true },
          },
          _count: {
            select: { users: true },
          },
        },
      });
    });
  }

  delete(id: string, organizationId?: string) {
    return this.prisma.speciality.deleteMany({
      where: {
        id,
        ...(organizationId ? { organizationId } : {}),
      },
    });
  }
}