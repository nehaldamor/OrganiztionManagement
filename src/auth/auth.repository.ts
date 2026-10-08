import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        organization: {
          select: { status: true },
        },
      },
    });
  }

  findActiveById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: {
          select: { status: true },
        },
      },
    });
  }
}
