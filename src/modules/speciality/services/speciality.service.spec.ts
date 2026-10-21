import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedUser } from '../../auth/auth.types';
import { SpecialityRepository } from '../repositories/speciality.repository';
import { SpecialityService } from './speciality.service';

describe('SpecialityService', () => {
  let service: SpecialityService;

  const mockRepository = {
    create: jest.fn(),
    list: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const organizationAdmin: AuthenticatedUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Organization Admin',
    role: 'ORGANIZATION_ADMIN',
    organizationId: 'org-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpecialityService,
        {
          provide: SpecialityRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SpecialityService>(SpecialityService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('allows a user to create a speciality for their organization', async () => {
    mockRepository.create.mockResolvedValue({ id: 'speciality-1' });

    await expect(
      service.create(organizationAdmin, {
        organizationId: 'org-1',
        name: 'Engineering',
        code: 'eng',
      }),
    ).resolves.toEqual({ id: 'speciality-1' });
    expect(mockRepository.create).toHaveBeenCalledWith({
      organizationId: 'org-1',
      name: 'Engineering',
      code: 'ENG',
      description: null,
    });
  });

  it('rejects a user creating a speciality for another organization', async () => {
    await expect(
      service.create(organizationAdmin, {
        organizationId: 'org-2',
        name: 'Engineering',
        code: 'eng',
      }),
    ).rejects.toThrow(
      new ForbiddenException(
        'You can only create specialities in your own organization.',
      ),
    );
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it('allows a platform admin to create a speciality for any organization', async () => {
    mockRepository.create.mockResolvedValue({ id: 'speciality-1' });
    const platformAdmin: AuthenticatedUser = {
      ...organizationAdmin,
      role: 'PLATFORM_ADMIN',
      organizationId: null,
    };

    await expect(
      service.create(platformAdmin, {
        organizationId: 'org-2',
        name: 'Engineering',
        code: 'eng',
      }),
    ).resolves.toEqual({ id: 'speciality-1' });
  });

  it('lists only the current organization specialities for an organization user', async () => {
    mockRepository.list.mockResolvedValue([{ id: 'speciality-1' }]);

    await expect(
      service.list(organizationAdmin, 'org-1'),
    ).resolves.toEqual([{ id: 'speciality-1' }]);
    expect(mockRepository.list).toHaveBeenCalledWith('org-1');
  });

  it('rejects listing specialities for another organization', async () => {
    await expect(service.list(organizationAdmin, 'org-2')).rejects.toThrow(
      new ForbiddenException(
        'You can only list specialities in your own organization.',
      ),
    );
    expect(mockRepository.list).not.toHaveBeenCalled();
  });
});
