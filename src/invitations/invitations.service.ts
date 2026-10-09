import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { UserRole } from '../generated/prisma/enums';
import { createHash, randomBytes } from 'node:crypto';
import { hash } from 'bcryptjs';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { InvitationsRepository } from './invitations.repository';

type InvitedRole = Exclude<UserRole, 'PLATFORM_ADMIN'> | 'PLATFORM_ADMIN';

@Injectable()
export class InvitationsService {
  constructor(private readonly repository: InvitationsRepository) { }

  async invite(inviter: AuthenticatedUser, dto: InviteUserDto) {
    const organizationId = dto.organizationId?.trim() || null;

    if (!this.canInviteRole(inviter.role, dto.role)) {
      throw new ForbiddenException(
        'You are not allowed to invite a user with this role.',
      );
    }

    if (dto.role === 'PLATFORM_ADMIN') {
      if (inviter.role !== 'PLATFORM_ADMIN') {
        throw new ForbiddenException(
          'Only a platform administrator can invite another platform administrator.',
        );
      }
      if (organizationId) {
        throw new BadRequestException(
          'Platform administrator invitations cannot be assigned to an organization.',
        );
      }
    } else if (!organizationId) {
      throw new BadRequestException(
        'An organization ID is required for this invitation role.',
      );
    }

    if (
      inviter.role !== 'PLATFORM_ADMIN' &&
      inviter.organizationId !== organizationId
    ) {
      throw new ForbiddenException(
        'You cannot invite users to another organization.',
      );
    }

    if (organizationId) {
      const organization =
        await this.repository.findOrganizationForInvite(organizationId);

      if (!organization) {
        throw new NotFoundException('Organization not found.');
      }

      if (organization.status !== 'ACTIVE') {
        throw new ConflictException(
          'Reactivate the organization before inviting users.',
        );
      }

      if (
        inviter.role !== 'PLATFORM_ADMIN' &&
        dto.role !== 'ORGANIZATION_ADMIN' &&
        (await this.repository.countOrganizationAdmins(organizationId)) === 0
      ) {
        throw new ConflictException(
          'Invite an organization administrator before inviting other users.',
        );
      }
    }

    const email = dto.email.trim().toLowerCase();
    if (await this.repository.findUserByEmail(email)) {
      throw new ConflictException('A user with this email already exists.');
    }

    return this.createInvitation(organizationId, inviter.id, email, dto.role);
  }

  async acceptInvitation(dto: AcceptInvitationDto) {
    const invitation = await this.repository.findForAcceptance(
      this.hashToken(dto.token),
    );

    if (
      !invitation ||
      invitation.acceptedAt ||
      invitation.expiresAt <= new Date()
    ) {
      throw new BadRequestException(
        'The invitation is invalid, expired, or already accepted.',
      );
    }

    if (invitation.organization?.status === 'SUSPENDED') {
      throw new ConflictException('This organization is not active.');
    }

    if (
      (invitation.role === 'PLATFORM_ADMIN' && invitation.organizationId) ||
      (invitation.role !== 'PLATFORM_ADMIN' && !invitation.organizationId)
    ) {
      throw new BadRequestException('The invitation is invalid.');
    }

    const name = dto.name.trim();
    if (name.length < 2) {
      throw new BadRequestException('A valid name is required.');
    }

    try {
      const user = await this.repository.accept({
        invitationId: invitation.id,
        name,
        passwordHash: await hash(dto.password, 12),
        email: invitation.email,
        organizationId: invitation.organizationId,
        role: invitation.role,
      });

      if (!user) {
        throw new BadRequestException(
          'The invitation is invalid, expired, or already accepted.',
        );
      }

      return user;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A user with this email already exists.');
      }
      throw error;
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async createInvitation(
    organizationId: string | null,
    invitedById: string,
    email: string,
    role: InvitedRole,
  ) {
    const token = randomBytes(32).toString('hex');

    const invitation = await this.repository.createInvitation({
      organizationId,
      invitedById,
      email,
      role,
      tokenHash: this.hashToken(token),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      ...invitation,
      ...(process.env.NODE_ENV === 'production' ? {} : { token }),
    };
  }

  private canInviteRole(inviterRole: UserRole, inviteeRole: UserRole): boolean {
    const allowedRoles: Record<UserRole, UserRole[]> = {
      PLATFORM_ADMIN: [
        'PLATFORM_ADMIN',
        'ORGANIZATION_ADMIN',
        'MANAGER',
        'EMPLOYEE',
      ],
      ORGANIZATION_ADMIN: ['MANAGER', 'EMPLOYEE', 'ORGANIZATION_ADMIN'],
      MANAGER: ['EMPLOYEE'],
      EMPLOYEE: [],
    };

    return allowedRoles[inviterRole].includes(inviteeRole);
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
