import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { UserRole, UserStatus } from '../../../generated/prisma/enums';
import { PrismaService } from '../../../database/prisma.service';

const safeUserFields = {
  id: true,
  name: true,
  email: true,
  organizationId: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const userListFields = {
  ...safeUserFields,
  userspeciality: {
    select: {
      speciality: {
        select: { id: true, name: true, code: true },
      },
    },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class UserManagementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async organizationExists(organizationId: string): Promise<boolean> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    return organization !== null;
  }

  list(organizationId: string | null) {
    return this.prisma.user.findMany({
      where: organizationId ? { organizationId } : {},
      select: userListFields,
      orderBy: { createdAt: 'desc' },
    });
  }

  listAdminsWithOrganizations() {
    return this.prisma.user.findMany({
      where: {
        role: { in: ['PLATFORM_ADMIN', 'ORGANIZATION_ADMIN'] },
      },
      select: {
        ...safeUserFields,
        organization: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listOrganizationAdmins() {
    return this.prisma.user.findMany({
      where: { role: 'ORGANIZATION_ADMIN' },
      select: {
        ...safeUserFields,
        organization: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listSpecialitiesForUser(userId: string) {
    return this.prisma.userSpeciality.findMany({
      where: { userId },
      select: {
        speciality: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            organizationId: true,
          },
        },
      },
      orderBy: { speciality: { name: 'asc' } },
    });
  }

  specialityBelongsToOrganization(specialityId: string, organizationId: string | null) {
    if (!organizationId) return Promise.resolve(false);

    return this.prisma.speciality.findFirst({
      where: { id: specialityId, organizationId },
      select: { id: true },
    }).then((speciality) => speciality !== null);
  }

  async updateSpeciality(
    userId: string,
    organizationId: string | null,
    specialityId: string | null,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.userSpeciality.deleteMany({ where: { userId } });

      if (specialityId && organizationId) {
        await transaction.userSpeciality.create({
          data: {
            userId,
            specialityId,
            organizationId,
          },
        });
      }

      return transaction.user.findFirst({
        where: {
          id: userId,
          ...(organizationId ? { organizationId } : {}),
        },
        select: userListFields,
      });
    });
  }

  findById(id: string, organizationId: string | null) {
    return this.prisma.user.findFirst({
      where: {
        id,
        ...(organizationId ? { organizationId } : {}),
      },
      select: safeUserFields,
    });
  }

  async update(
    id: string,
    organizationId: string | null,
    data: { name?: string; role?: UserRole; status?: UserStatus },
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.user.updateMany({
        where: {
          id,
          ...(organizationId ? { organizationId } : {}),
        },
        data,
      });

      if (result.count !== 1) {
        return null;
      }

      return transaction.user.findFirst({
        where: {
          id,
          ...(organizationId ? { organizationId } : {}),
        },
        select: safeUserFields,
      });
    });
  }

  delete(id: string, organizationId: string | null) {
    return this.prisma.user.deleteMany({
      where: {
        id,
        ...(organizationId ? { organizationId } : {}),
      },
    });
  }
}
