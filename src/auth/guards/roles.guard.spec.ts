import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../generated/prisma/enums';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  function contextForRole(role?: UserRole): ExecutionContext {
    const request = role ? { user: { role } } : {};

    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it('allows routes without role metadata', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(contextForRole())).toBe(true);
  });

  it('allows a user whose role is listed', () => {
    reflector.getAllAndOverride.mockReturnValue([
      'PLATFORM_ADMIN',
      'ORGANIZATION_ADMIN',
    ]);

    expect(guard.canActivate(contextForRole('ORGANIZATION_ADMIN'))).toBe(true);
  });

  it('rejects a user whose role is not listed', () => {
    reflector.getAllAndOverride.mockReturnValue(['PLATFORM_ADMIN']);

    expect(() => guard.canActivate(contextForRole('MANAGER'))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects a request without an authenticated user on a role-protected route', () => {
    reflector.getAllAndOverride.mockReturnValue(['PLATFORM_ADMIN']);

    expect(() => guard.canActivate(contextForRole())).toThrow(
      ForbiddenException,
    );
  });
});
