import { PrismaService } from '../prisma/prisma.service';
import { InvitationsRepository } from './invitations.repository';

describe('InvitationsRepository', () => {
  it('updates the existing pending invitation instead of creating a duplicate', async () => {
    const expiresAt = new Date('2030-01-01');
    const updatedData: Array<{
      invitedById: string;
      role: string;
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
      tokenHash: 'new-token-hash',
      expiresAt,
    });

    expect(transaction.invitation.update).toHaveBeenCalledTimes(1);
    expect(updatedData).toEqual([
      {
        invitedById: 'admin-1',
        role: 'MANAGER',
        tokenHash: 'new-token-hash',
        expiresAt,
      },
    ]);
    expect(transaction.invitation.create).not.toHaveBeenCalled();
  });
});
