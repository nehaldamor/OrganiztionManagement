import { Test, TestingModule } from '@nestjs/testing';
import { InvitationsRepository } from './invitations.repository';
import { InvitationsService } from './invitations.service';
import { AuthenticatedUser } from '../auth/auth.types';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let repository: {
    findOrganizationForInvite: jest.Mock;
    countOrganizationAdmins: jest.Mock;
    findUserByEmail: jest.Mock;
    createInvitation: jest.Mock;
    findForAcceptance: jest.Mock;
    accept: jest.Mock;
  };

  const platformAdmin: AuthenticatedUser = {
    id: 'platform-1',
    email: 'platform@example.com',
    name: 'Platform Admin',
    role: 'PLATFORM_ADMIN',
    organizationId: null,
  };

  beforeEach(async () => {
    repository = {
      findOrganizationForInvite: jest.fn(),
      countOrganizationAdmins: jest.fn(),
      findUserByEmail: jest.fn(),
      createInvitation: jest.fn(),
      findForAcceptance: jest.fn(),
      accept: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: InvitationsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
  });

  it.each([
    'PLATFORM_ADMIN',
    'ORGANIZATION_ADMIN',
    'MANAGER',
    'EMPLOYEE',
  ] as const)('allows platform admins to invite role %s', async (role) => {
    repository.findOrganizationForInvite.mockResolvedValue({
      status: 'ACTIVE',
      _count: { users: 0 },
    });
    repository.findUserByEmail.mockResolvedValue(null);
    repository.createInvitation.mockResolvedValue({
      id: 'invite-1',
      email: 'user@example.com',
      role,
    });

    const result = await service.invite(platformAdmin, {
      email: 'USER@example.com',
      role,
      ...(role === 'PLATFORM_ADMIN' ? {} : { organizationId: 'org-1' }),
    });

    expect(repository.createInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: role === 'PLATFORM_ADMIN' ? null : 'org-1',
        invitedById: platformAdmin.id,
        email: 'user@example.com',
        role,
      }),
    );
    expect(result).toHaveProperty('token');
  });

  it('allows organization admins to invite managers and employees in their org', async () => {
    repository.findOrganizationForInvite.mockResolvedValue({
      status: 'ACTIVE',
      _count: { users: 1 },
    });
    repository.countOrganizationAdmins.mockResolvedValue(1);
    repository.findUserByEmail.mockResolvedValue(null);
    repository.createInvitation.mockResolvedValue({
      id: 'invite-2',
      email: 'manager@example.com',
      role: 'MANAGER',
    });

    await expect(
      service.invite(
        {
          ...platformAdmin,
          role: 'ORGANIZATION_ADMIN',
          organizationId: 'org-1',
        },
        {
          email: 'manager@example.com',
          role: 'MANAGER',
          organizationId: 'org-1',
        },
      ),
    ).resolves.toHaveProperty('role', 'MANAGER');
  });

  it('allows managers to invite employees only', async () => {
    repository.findOrganizationForInvite.mockResolvedValue({
      status: 'ACTIVE',
      _count: { users: 2 },
    });
    repository.countOrganizationAdmins.mockResolvedValue(1);
    repository.findUserByEmail.mockResolvedValue(null);
    repository.createInvitation.mockResolvedValue({
      id: 'invite-3',
      email: 'employee@example.com',
      role: 'EMPLOYEE',
    });

    const manager = {
      ...platformAdmin,
      role: 'MANAGER' as const,
      organizationId: 'org-1',
    };

    await expect(
      service.invite(manager, {
        email: 'employee@example.com',
        role: 'EMPLOYEE',
        organizationId: 'org-1',
      }),
    ).resolves.toHaveProperty('role', 'EMPLOYEE');

    await expect(
      service.invite(manager, {
        email: 'admin2@example.com',
        role: 'ORGANIZATION_ADMIN',
        organizationId: 'org-1',
      }),
    ).rejects.toThrow('You are not allowed to invite a user with this role.');
  });

  it('rejects org invitations without an organization ID', async () => {
    await expect(
      service.invite(platformAdmin, {
        email: 'employee@example.com',
        role: 'EMPLOYEE',
      }),
    ).rejects.toThrow(
      'An organization ID is required for this invitation role.',
    );
  });

  it('prevents organization users from inviting platform admins', async () => {
    const organizationAdmin = {
      ...platformAdmin,
      role: 'ORGANIZATION_ADMIN' as const,
      organizationId: 'org-1',
    };

    await expect(
      service.invite(organizationAdmin, {
        email: 'platform@example.com',
        role: 'PLATFORM_ADMIN',
      }),
    ).rejects.toThrow('You are not allowed to invite a user with this role.');
    expect(repository.findUserByEmail).not.toHaveBeenCalled();
  });

  it('prevents organization users from inviting into another organization', async () => {
    repository.findOrganizationForInvite.mockResolvedValue({
      status: 'ACTIVE',
      _count: { users: 1 },
    });

    await expect(
      service.invite(
        {
          ...platformAdmin,
          role: 'ORGANIZATION_ADMIN',
          organizationId: 'org-1',
        },
        {
          email: 'employee@example.com',
          role: 'EMPLOYEE',
          organizationId: 'org-2',
        },
      ),
    ).rejects.toThrow('You cannot invite users to another organization.');
  });

  it('rejects acceptance when the token is invalid', async () => {
    repository.findForAcceptance.mockResolvedValue(null);

    await expect(
      service.acceptInvitation({
        token: 'a'.repeat(64),
        name: 'New Admin',
        password: 'a-secure-password',
      }),
    ).rejects.toThrow(
      'The invitation is invalid, expired, or already accepted.',
    );
  });

  it('accepts a valid global platform-admin invitation', async () => {
    repository.findForAcceptance.mockResolvedValue({
      id: 'invite-global',
      email: 'new-platform@example.com',
      organizationId: null,
      role: 'PLATFORM_ADMIN',
      acceptedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      organization: null,
    });
    repository.accept.mockResolvedValue({
      id: 'platform-2',
      email: 'new-platform@example.com',
      role: 'PLATFORM_ADMIN',
      organizationId: null,
      status: 'ACTIVE',
    });

    await expect(
      service.acceptInvitation({
        token: 'b'.repeat(64),
        name: 'New Platform Admin',
        password: 'a-secure-password',
      }),
    ).resolves.toMatchObject({
      role: 'PLATFORM_ADMIN',
      organizationId: null,
    });
  });
});
