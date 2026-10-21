import { Test, TestingModule } from '@nestjs/testing';
import { TeammanagementService } from './teammanagement.service';

describe('TeammanagementService', () => {
  let service: TeammanagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeammanagementService],
    }).compile();

    service = module.get<TeammanagementService>(TeammanagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
