import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { name: string; slug: string }) {
    return this.prisma.organization.create({ data });
  }

  count() {
    return this.prisma.organization.count();
  }

  list() {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true, invitations: true } } },
    });
  }

  listPaginated(skip: number, take: number) {
    return this.prisma.organization.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true, invitations: true } } },
    });
  }

  findById(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: { _count: { select: { users: true, invitations: true } } },
    });
  }

  update(
    id: string,
    data: { name?: string; slug?: string; status?: 'ACTIVE' | 'SUSPENDED' },
  ) {
    return this.prisma.organization.update({ where: { id }, data });
  }
}
