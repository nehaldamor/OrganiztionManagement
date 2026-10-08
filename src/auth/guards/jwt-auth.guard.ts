import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthRepository } from '../auth.repository';
import { AuthenticatedUser, JwtPayload } from '../auth.types';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('A bearer access token is required.');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException(
        'The access token is invalid or expired.',
      );
    }

    if (!payload.sub) {
      throw new UnauthorizedException('The access token is invalid.');
    }

    const user = await this.authRepository.findActiveById(payload.sub);

    if (
      !user ||
      user.status !== 'ACTIVE' ||
      user.organization?.status === 'SUSPENDED' ||
      (user.role !== 'PLATFORM_ADMIN' && !user.organizationId)
    ) {
      throw new UnauthorizedException('This account is not active.');
    }

    request.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
    };

    return true;
  }
}
