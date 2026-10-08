import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvitationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOrganizationForInvite(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      select: {
        status: true,
        _count: { select: { users: true } },
      },
    });
  }

  countOrganizationAdmins(organizationId: string) {
    return this.prisma.user.count({
      where: { organizationId, role: 'ORGANIZATION_ADMIN' },
    });
  }

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  createInvitation(data: {
    organizationId: string | null;
    invitedById: string;
    email: string;
    role: 'PLATFORM_ADMIN' | 'ORGANIZATION_ADMIN' | 'MANAGER' | 'EMPLOYEE';
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.upsertPendingInvitation(data);
  }

  private async upsertPendingInvitation(data: {
    organizationId: string | null;
    invitedById: string;
    email: string;
    role: 'PLATFORM_ADMIN' | 'ORGANIZATION_ADMIN' | 'MANAGER' | 'EMPLOYEE';
    tokenHash: string;
    expiresAt: Date;
  }) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (transaction) => {
            const existing = await transaction.invitation.findFirst({
              where: {
                organizationId: data.organizationId,
                email: data.email,
                acceptedAt: null,
              },
              orderBy: { createdAt: 'desc' },
              select: { id: true },
            });

            if (existing) {
              await transaction.invitation.updateMany({
                where: {
                  organizationId: data.organizationId,
                  email: data.email,
                  acceptedAt: null,
                  id: { not: existing.id },
                },
                data: { expiresAt: new Date() },
              });

              return transaction.invitation.update({
                where: { id: existing.id },
                data: {
                  invitedById: data.invitedById,
                  role: data.role,
                  tokenHash: data.tokenHash,
                  expiresAt: data.expiresAt,
                },
                select: {
                  id: true,
                  email: true,
                  role: true,
                  expiresAt: true,
                  createdAt: true,
                },
              });
            }

            return transaction.invitation.create({
              data,
              select: {
                id: true,
                email: true,
                role: true,
                expiresAt: true,
                createdAt: true,
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        const isSerializationConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';

        if (!isSerializationConflict || attempt === 2) {
          throw error;
        }
      }
    }

    throw new Error('Could not safely update the pending invitation.');
  }

  findForAcceptance(tokenHash: string) {
    return this.prisma.invitation.findUnique({
      where: { tokenHash },
      include: { organization: { select: { status: true } } },
    });
  }

  accept(data: {
    invitationId: string;
    name: string;
    passwordHash: string;
    email: string;
    organizationId: string | null;
    role: 'PLATFORM_ADMIN' | 'ORGANIZATION_ADMIN' | 'MANAGER' | 'EMPLOYEE';
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.invitation.updateMany({
        where: {
          id: data.invitationId,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { acceptedAt: new Date() },
      });

      if (claimed.count !== 1) {
        return null;
      }

      return transaction.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          organizationId: data.organizationId,
          role: data.role,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          email: true,
          organizationId: true,
          role: true,
          status: true,
        },
      });
    });
  }
}
