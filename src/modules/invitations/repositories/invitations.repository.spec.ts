import { PrismaService } from '../../../database/prisma.service';
import { InvitationsRepository } from './invitations.repository';

describe('InvitationsRepository', () => {
  it('updates the existing pending invitation instead of creating a duplicate', async () => {
    const expiresAt = new Date('2030-01-01');
    const updatedData: Array<{
      invitedById: string;
      role: string;
      specialityId: string | null;
      tokenHash: string;
      expiresAt: Date;
    }> = [];

    const transaction = {
      invitation: {
        findFirst: jest.fn().mockResolvedValue({ id: 'existing-invitation' }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest.fn((input: { data: (typeof updatedData)[number] }) => {
          updatedData.push(input.data);
          return {
            id: 'existing-invitation',
            email: 'user@example.com',
            role: 'MANAGER',
          };
        }),
        create: jest.fn(),
      },
    };

    const prisma = {
      $transaction: jest.fn(
        async (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };
    const repository = new InvitationsRepository(
      prisma as unknown as PrismaService,
    );

    await repository.createInvitation({
      organizationId: 'org-1',
      invitedById: 'admin-1',
      email: 'user@example.com',
      role: 'MANAGER',
      specialityId: null,
      tokenHash: 'new-token-hash',
      expiresAt,
    });

    expect(transaction.invitation.update).toHaveBeenCalledTimes(1);
    expect(updatedData).toEqual([
      {
        invitedById: 'admin-1',
        role: 'MANAGER',
        specialityId: null,
        tokenHash: 'new-token-hash',
        expiresAt,
      },
    ]);
    expect(transaction.invitation.create).not.toHaveBeenCalled();
  });

  it('creates the user speciality assignment in the acceptance transaction', async () => {
    const transaction = {
      invitation: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          name: 'New Employee',
          email: 'employee@example.com',
          organizationId: 'org-1',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
        }),
      },
      userSpeciality: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn(
        async (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };
    const repository = new InvitationsRepository(
      prisma as unknown as PrismaService,
    );

    await repository.accept({
      invitationId: 'invitation-1',
      name: 'New Employee',
      passwordHash: 'hashed-password',
      email: 'employee@example.com',
      organizationId: 'org-1',
      role: 'EMPLOYEE',
      specialityId: 'speciality-1',
    });

    expect(transaction.user.create).toHaveBeenCalled();
    expect(transaction.userSpeciality.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        specialityId: 'speciality-1',
        organizationId: 'org-1',
      },
    });
  });

  it('does not create a speciality assignment when none was invited', async () => {
    const transaction = {
      invitation: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          name: 'New Employee',
          email: 'employee@example.com',
          organizationId: 'org-1',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
        }),
      },
      userSpeciality: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn(
        async (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };
    const repository = new InvitationsRepository(
      prisma as unknown as PrismaService,
    );

    await repository.accept({
      invitationId: 'invitation-1',
      name: 'New Employee',
      passwordHash: 'hashed-password',
      email: 'employee@example.com',
      organizationId: 'org-1',
      role: 'EMPLOYEE',
      specialityId: null,
    });

    expect(transaction.userSpeciality.create).not.toHaveBeenCalled();
  });
});
