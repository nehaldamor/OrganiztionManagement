import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PlatformAdminGuard } from './platform-admin.guard';

describe('PlatformAdminGuard', () => {
  const guard = new PlatformAdminGuard();

  function contextForRole(role: string): ExecutionContext {
    const request = {
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
        role,
        organizationId: null,
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  }

  it('allows platform administrators', () => {
    expect(guard.canActivate(contextForRole('PLATFORM_ADMIN'))).toBe(true);
  });

  it('rejects organization users', () => {
    expect(() =>
      guard.canActivate(contextForRole('ORGANIZATION_ADMIN')),
    ).toThrow(ForbiddenException);
  });
});
