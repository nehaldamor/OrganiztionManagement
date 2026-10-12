import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationRepository } from './organization.repository';
import { OrganizationService } from './organization.service';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let repository: {
    create: jest.Mock;
    list: jest.Mock;
    listPaginated: jest.Mock;
    count: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      list: jest.fn(),
      listPaginated: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        { provide: OrganizationRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  it('creates an organization with a normalized slug', async () => {
    repository.create.mockResolvedValue({
      id: 'org-1',
      name: 'North Star',
      slug: 'north-star',
    });

    await expect(service.create({ name: ' North Star ' })).resolves.toEqual({
      id: 'org-1',
      name: 'North Star',
      slug: 'north-star',
    });
    expect(repository.create).toHaveBeenCalledWith({
      name: 'North Star',
      slug: 'north-star',
    });
  });

  it('returns a paginated list of organizations', async () => {
    const organizations = [{ id: 'org-1', name: 'North Star' }];
    repository.listPaginated.mockResolvedValue(organizations);
    repository.count.mockResolvedValue(12);

    await expect(service.list('2', '5')).resolves.toEqual({
      organizations,
      data: organizations,
      meta: {
        page: 2,
        limit: 5,
        totalItems: 12,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      },
      pagination: {
        page: 2,
        limit: 5,
        totalItems: 12,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      },
    });

    expect(repository.listPaginated).toHaveBeenCalledWith(5, 5);
    expect(repository.count).toHaveBeenCalledWith();
  });
});
