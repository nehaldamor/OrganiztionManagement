import { Test, TestingModule } from '@nestjs/testing';
import { TeammanagementController } from './teammanagement.controller';

describe('TeammanagementController', () => {
  let controller: TeammanagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeammanagementController],
    }).compile();

    controller = module.get<TeammanagementController>(TeammanagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
