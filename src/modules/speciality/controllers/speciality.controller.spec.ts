import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthRepository } from '../../auth/repositories/auth.repository';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SpecialityController } from './speciality.controller';
import { SpecialityService } from '../services/speciality.service';

describe('SpecialityController', () => {
  let controller: SpecialityController;

  const mockService = {
    create: jest.fn(),
    list: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpecialityController],
      providers: [
        {
          provide: SpecialityService,
          useValue: mockService,
        },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn() },
        },
        {
          provide: AuthRepository,
          useValue: { findActiveById: jest.fn() },
        },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn(() => []) },
        },
      ],
    }).compile();

    controller = module.get<SpecialityController>(SpecialityController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
