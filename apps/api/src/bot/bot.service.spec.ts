import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BotService } from './bot.service';
import { PrismaService } from '../services/prisma.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BotService', () => {
  let service: BotService;
  let prisma: PrismaService;

  const mockPrisma = {
    userSubscription: {
      findUnique: jest.fn(),
    },
    freeTier: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    bot: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:8000'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BotService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<BotService>(BotService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('getBot', () => {
    it('should return bot details if found', async () => {
      const mockBot = {
        id: 'bot-123',
        name: 'Support Bot',
        model: 'gemini-2.0-flash',
        userId: 'user-123',
        description: 'Test Bot',
        private: true,
        theme: 'default',
        profile_image: null,
        kb: null,
      };
      mockPrisma.bot.findUnique.mockResolvedValue(mockBot);

      const result = await service.getBot('bot-123');
      expect(result.id).toBe('bot-123');
      expect(result.name).toBe('Support Bot');
    });

    it('should throw NotFoundException if bot does not exist', async () => {
      mockPrisma.bot.findUnique.mockResolvedValue(null);

      await expect(service.getBot('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('modifyAccess', () => {
    it('should update bot privacy successfully', async () => {
      mockPrisma.bot.findUnique.mockResolvedValue({
        id: 'bot-123',
        private: true,
      });
      mockPrisma.bot.update.mockResolvedValue({
        id: 'bot-123',
        private: false,
      });

      const result = await service.modifyAccess({
        bot_id: 'bot-123',
        private: false,
      });
      expect(result).toEqual({
        message: 'Access modified successfully',
        bot_id: 'bot-123',
        private: false,
      });
    });

    it('should throw NotFoundException if bot not found', async () => {
      mockPrisma.bot.findUnique.mockResolvedValue(null);

      await expect(
        service.modifyAccess({ bot_id: 'nonexistent', private: false }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createBot', () => {
    it('should throw ForbiddenException if user has no subscription and no free credits', async () => {
      mockPrisma.userSubscription.findUnique.mockResolvedValue(null);
      mockPrisma.freeTier.findUnique.mockResolvedValue({ freeUrlCredit: 0 });

      await expect(
        service.createBot({
          user_id: 'u-1',
          bot_id: 'b-1',
          kb_id: 'kb-1',
          bot_name: 'My Bot',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create bot and decrement free tier when free tier is active', async () => {
      mockPrisma.userSubscription.findUnique.mockResolvedValue(null);
      mockPrisma.freeTier.findUnique.mockResolvedValue({ freeUrlCredit: 2 });
      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { status: 'success' },
      });
      mockPrisma.bot.create.mockResolvedValue({ id: 'b-1' });
      mockPrisma.freeTier.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.createBot({
        user_id: 'u-1',
        bot_id: 'b-1',
        kb_id: 'kb-1',
        bot_name: 'My Bot',
      });

      expect(result.bot_id).toBe('b-1');
      expect(result.usedFreeTier).toBe(true);
      expect(mockPrisma.freeTier.updateMany).toHaveBeenCalled();
    });
  });
});
