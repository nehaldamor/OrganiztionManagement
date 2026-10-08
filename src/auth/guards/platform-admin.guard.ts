import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth.types';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user: AuthenticatedUser;
    }>();

    if (request.user.role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException(
        'Platform administrator access is required.',
      );
    }

    return true;
  }
}
