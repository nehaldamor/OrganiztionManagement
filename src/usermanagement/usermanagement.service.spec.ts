import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UserManagementRepository } from './usermanagement.repository';
import { UsermanagementService } from './usermanagement.service';

describe('UsermanagementService', () => {
  let service: UsermanagementService;
  let repository: {
    organizationExists: jest.Mock;
    list: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  const platformAdmin: AuthenticatedUser = {
    id: 'platform-1',
    email: 'platform@example.com',
    name: 'Platform Admin',
    role: 'PLATFORM_ADMIN',
    organizationId: null,
  };
  const organizationAdmin: AuthenticatedUser = {
    id: 'org-admin-1',
    email: 'admin@example.com',
    name: 'Org Admin',
    role: 'ORGANIZATION_ADMIN',
    organizationId: 'org-1',
  };
  const manager: AuthenticatedUser = {
    id: 'manager-1',
    email: 'manager@example.com',
    name: 'Manager',
    role: 'MANAGER',
    organizationId: 'org-1',
  };

  beforeEach(async () => {
    repository = {
      organizationExists: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsermanagementService,
        { provide: UserManagementRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<UsermanagementService>(UsermanagementService);
  });

  it('requires organizationId when a platform admin lists users', async () => {
    await expect(service.list(platformAdmin)).rejects.toThrow(
      'organizationId is required when listing users as a platform admin.',
    );
    expect(repository.list).not.toHaveBeenCalled();
  });

  it('lists users for the selected organization for a platform admin', async () => {
    repository.organizationExists.mockResolvedValue(true);
    repository.list.mockResolvedValue([]);

    await service.list(platformAdmin, 'org-2');

    expect(repository.organizationExists).toHaveBeenCalledWith('org-2');
    expect(repository.list).toHaveBeenCalledWith('org-2');
  });

  it('rejects unknown organizations for platform admin user listing', async () => {
    repository.organizationExists.mockResolvedValue(false);

    await expect(service.list(platformAdmin, 'missing-org')).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.list).not.toHaveBeenCalled();
  });

  it.each([organizationAdmin, manager])(
    'scopes user list to the current organization for %s',
    async (actor) => {
      repository.list.mockResolvedValue([]);

      await service.list(actor);

      expect(repository.list).toHaveBeenCalledWith('org-1');
    },
  );

  it('does not allow organization users to request another organization user list', async () => {
    await expect(service.list(manager, 'org-2')).rejects.toThrow(
      ForbiddenException,
    );
    expect(repository.list).not.toHaveBeenCalled();
  });

  it('allows managers to view users in their organization', async () => {
    repository.findById.mockResolvedValue({
      id: 'employee-1',
      organizationId: 'org-1',
    });

    await expect(service.get(manager, 'employee-1')).resolves.toMatchObject({
      id: 'employee-1',
    });
    expect(repository.findById).toHaveBeenCalledWith('employee-1', 'org-1');
  });

  it('does not reveal a user outside the organization', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.get(organizationAdmin, 'foreign-user'),
    ).rejects.toThrow(NotFoundException);
    expect(repository.findById).toHaveBeenCalledWith('foreign-user', 'org-1');
  });

  it('allows an organization admin to update users within their organization', async () => {
    repository.findById.mockResolvedValue({
      id: 'employee-1',
      name: 'Old Name',
      role: 'EMPLOYEE',
      organizationId: 'org-1',
    });
    repository.update.mockResolvedValue({
      id: 'employee-1',
      name: 'New Name',
      role: 'EMPLOYEE',
      organizationId: 'org-1',
    });

    await expect(
      service.update(organizationAdmin, 'employee-1', { name: ' New Name ' }),
    ).resolves.toMatchObject({ name: 'New Name' });
    expect(repository.update).toHaveBeenCalledWith('employee-1', 'org-1', {
      name: 'New Name',
    });
  });

  it('allows a platform admin to update a user in any organization', async () => {
    repository.findById.mockResolvedValue({
      id: 'employee-1',
      role: 'EMPLOYEE',
      organizationId: 'org-other',
    });
    repository.update.mockResolvedValue({
      id: 'employee-1',
      status: 'SUSPENDED',
    });

    await service.update(platformAdmin, 'employee-1', { status: 'SUSPENDED' });

    expect(repository.update).toHaveBeenCalledWith('employee-1', null, {
      status: 'SUSPENDED',
    });
  });

  it('does not allow a user to change their own role or suspend their own account', async () => {
    repository.findById.mockResolvedValue({
      id: organizationAdmin.id,
      role: 'ORGANIZATION_ADMIN',
      organizationId: 'org-1',
    });

    await expect(
      service.update(organizationAdmin, organizationAdmin.id, {
        role: 'EMPLOYEE',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.update(organizationAdmin, organizationAdmin.id, {
        status: 'SUSPENDED',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('does not allow changing a platform admin role through user management', async () => {
    repository.findById.mockResolvedValue({
      id: 'platform-target',
      role: 'PLATFORM_ADMIN',
      organizationId: null,
    });

    await expect(
      service.update(platformAdmin, 'platform-target', { role: 'EMPLOYEE' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows an organization admin to delete only within their organization', async () => {
    repository.delete.mockResolvedValue({ count: 1 });

    await expect(
      service.delete(organizationAdmin, 'employee-1'),
    ).resolves.toEqual({ message: 'User deleted successfully.' });
    expect(repository.delete).toHaveBeenCalledWith('employee-1', 'org-1');
  });

  it('allows a platform admin to delete across organizations', async () => {
    repository.delete.mockResolvedValue({ count: 1 });

    await service.delete(platformAdmin, 'employee-1');

    expect(repository.delete).toHaveBeenCalledWith('employee-1', null);
  });

  it('prevents deleting the current user', async () => {
    await expect(
      service.delete(organizationAdmin, organizationAdmin.id),
    ).rejects.toThrow(BadRequestException);
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
