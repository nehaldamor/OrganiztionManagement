import { Test, TestingModule } from '@nestjs/testing';
import { UsermanagementController } from './usermanagement.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsermanagementService } from './usermanagement.service';

describe('UsermanagementController', () => {
  let controller: UsermanagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsermanagementController],
      providers: [{ provide: UsermanagementService, useValue: {} }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsermanagementController>(UsermanagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
