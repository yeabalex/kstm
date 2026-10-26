import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { QueryService } from './query.service';
import { PrismaService } from '../services/prisma.service';
import axios from 'axios';
import redis from '../utils/redis';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../utils/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    on: jest.fn(),
  },
}));

describe('QueryService', () => {
  let service: QueryService;
  let prisma: PrismaService;

  const mockPrisma = {
    userSubscription: {
      findUnique: jest.fn(),
    },
    freeTier: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:8000'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<QueryService>(QueryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('query', () => {
    const queryDto = {
      user_id: 'u-123',
      bot_id: 'b-123',
      kb_id: 'kb-123',
      session_id: 'sess-123',
      input_text: 'Hello assistant',
    };

    it('should forward query if user has active subscription in Redis cache', async () => {
      const activeEndDate = new Date(Date.now() + 86400000).toISOString();
      (redis.get as jest.Mock).mockResolvedValue(
        JSON.stringify({ endDate: activeEndDate }),
      );
      mockedAxios.post.mockResolvedValue({
        data: { answer: 'Hello! How can I help you today?' },
      });

      const result = await service.query(queryDto);

      expect(result.externalData.answer).toBe(
        'Hello! How can I help you today?',
      );
    });

    it('should fall back to free tier when subscription is not found and free credits exist', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      mockPrisma.userSubscription.findUnique.mockResolvedValue(null);
      mockPrisma.freeTier.findUnique.mockResolvedValue({
        id: 1,
        freeChatCredit: 5,
      });
      mockPrisma.freeTier.update.mockResolvedValue({
        id: 1,
        freeChatCredit: 4,
      });
      mockedAxios.post.mockResolvedValue({
        data: { answer: 'Free tier answer' },
      });

      const result = await service.query(queryDto);

      expect(result.message).toContain('Free Tier credit used');
      expect(mockPrisma.freeTier.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when no active subscription and 0 free credits', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      mockPrisma.userSubscription.findUnique.mockResolvedValue(null);
      mockPrisma.freeTier.findUnique.mockResolvedValue({
        id: 1,
        freeChatCredit: 0,
      });

      await expect(service.query(queryDto)).rejects.toThrow(ForbiddenException);
    });
  });
});
