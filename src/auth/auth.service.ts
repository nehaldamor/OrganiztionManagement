import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login({ email, password }: LoginDto) {
    const user = await this.authRepository.findByEmail(email.toLowerCase());

    if (!user || !(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (
      user.status !== 'ACTIVE' ||
      user.organization?.status === 'SUSPENDED' ||
      (user.role !== 'PLATFORM_ADMIN' && !user.organizationId)
    ) {
      throw new UnauthorizedException('This account is not active.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
      organizationId: user.organizationId,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }
}
