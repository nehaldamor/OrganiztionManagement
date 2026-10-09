import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { UserRole, UserStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

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
      select: safeUserFields,
      orderBy: { createdAt: 'desc' },
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
