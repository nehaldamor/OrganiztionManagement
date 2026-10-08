import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: { findByEmail: jest.Mock };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    authRepository = { findByEmail: jest.fn() };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: authRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('issues a token and returns safe user fields for valid credentials', async () => {
    const passwordHash = await hash('correct-password', 4);
    authRepository.findByEmail.mockResolvedValue({
      id: 'admin-id',
      name: 'Platform Administrator',
      email: 'admin@example.com',
      passwordHash,
      role: 'PLATFORM_ADMIN',
      status: 'ACTIVE',
      organizationId: null,
      organization: null,
    });

    await expect(
      service.login({
        email: 'ADMIN@example.com',
        password: 'correct-password',
      }),
    ).resolves.toEqual({
      accessToken: 'signed-token',
      user: {
        id: 'admin-id',
        name: 'Platform Administrator',
        email: 'admin@example.com',
        role: 'PLATFORM_ADMIN',
        organizationId: null,
      },
    });
    expect(authRepository.findByEmail).toHaveBeenCalledWith(
      'admin@example.com',
    );
  });

  it('rejects invalid credentials', async () => {
    authRepository.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'password' }),
    ).rejects.toThrow('Invalid email or password.');
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rejects a suspended account', async () => {
    const passwordHash = await hash('correct-password', 4);
    authRepository.findByEmail.mockResolvedValue({
      id: 'admin-id',
      name: 'Platform Administrator',
      email: 'admin@example.com',
      passwordHash,
      role: 'PLATFORM_ADMIN',
      status: 'SUSPENDED',
      organizationId: null,
      organization: null,
    });

    await expect(
      service.login({
        email: 'admin@example.com',
        password: 'correct-password',
      }),
    ).rejects.toThrow('This account is not active.');
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});
