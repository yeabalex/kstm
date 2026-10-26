import {
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserSubscription } from '@prisma/client';
import { PrismaService } from '../services/prisma.service';
import redis from '../utils/redis';
import axios from 'axios';
import { QueryDto } from './dto/query.dto';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl =
      this.configService.get<string>('AI_SERVICE_URL') ||
      'http://localhost:8000';
  }

  async query(data: QueryDto) {
    const cacheKey = `subscription:${data.user_id}`;
    let userSubscription: UserSubscription | null = null;

    try {
      const cachedSub = await redis.get(cacheKey);
      if (cachedSub) {
        userSubscription = JSON.parse(cachedSub);
      }
    } catch (cacheErr) {
      this.logger.warn(`Redis cache read failed: ${cacheErr.message}`);
    }

    if (!userSubscription) {
      userSubscription = await this.prisma.userSubscription.findUnique({
        where: { userId: data.user_id },
      });

      if (!userSubscription) {
        return this.checkFreeTier(data.user_id, data);
      }

      const ttl = 30 * 24 * 60 * 60; // 30 days
      try {
        await redis.set(cacheKey, JSON.stringify(userSubscription), 'EX', ttl);
      } catch (cacheErr) {
        this.logger.warn(`Redis cache write failed: ${cacheErr.message}`);
      }
    }

    const isActive = userSubscription.endDate
      ? new Date(userSubscription.endDate) > new Date()
      : false;

    if (!isActive) {
      return this.checkFreeTier(data.user_id, data);
    }

    return this.sendQueryToAIService(data);
  }

  async checkFreeTier(userId: string, data: QueryDto) {
    const freeTier = await this.prisma.freeTier.findUnique({
      where: { userId },
    });

    const hasFreeTier = freeTier && freeTier.freeChatCredit > 0;

    if (hasFreeTier) {
      const response = await this.sendQueryToAIService(data);
      await this.prisma.freeTier.update({
        where: { id: freeTier.id },
        data: { freeChatCredit: { decrement: 1 } },
      });

      return {
        message: 'Query processed successfully (Free Tier credit used)',
        externalData: response.externalData,
      };
    }

    throw new ForbiddenException(
      'User subscription is inactive and free chat credits are exhausted',
    );
  }

  async sendQueryToAIService(payload: QueryDto) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/query`, payload);

      return {
        message: 'Query data retrieved successfully',
        externalData: response.data,
      };
    } catch (error) {
      this.logger.error('Error calling AI service query endpoint:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      throw new InternalServerErrorException(
        error.response?.data?.detail || 'Failed to process AI query.',
      );
    }
  }
}
