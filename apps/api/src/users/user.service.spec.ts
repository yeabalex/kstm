import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../services/prisma.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    freeTier: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('registerUser', () => {
    it('should create user and free tier in transaction', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const createdUser = {
        id: 'new-uuid',
        firstname: 'Jane',
        lastname: 'Doe',
        email: 'jane@example.com',
        password: 'hashed-password',
      };
      mockPrisma.$transaction.mockResolvedValue([
        createdUser,
        { id: 1, userId: 'new-uuid' },
      ]);

      const result = await service.registerUser({
        firstname: 'Jane',
        lastname: 'Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'jane@example.com' },
      });
      expect(result.id).toBe('new-uuid');
      expect((result as any).password).toBeUndefined();
    });

    it('should throw ConflictException if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'jane@example.com',
      });

      await expect(
        service.registerUser({
          firstname: 'Jane',
          lastname: 'Doe',
          email: 'jane@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
