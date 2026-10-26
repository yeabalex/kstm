import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../services/prisma.service';
import axios from 'axios';
import { CreateBotDto } from './dto/create-bot.dto';
import { ModifyAccessDto } from './dto/modify-access.dto';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl =
      this.configService.get<string>('AI_SERVICE_URL') ||
      'http://localhost:8000';
  }

  async createBot(bot: CreateBotDto) {
    let usesFreeTier = false;
    let usesSubscription = true;

    const [subscription, freeTier] = await Promise.all([
      this.prismaService.userSubscription.findUnique({
        where: { userId: bot.user_id },
      }),
      this.prismaService.freeTier.findUnique({
        where: { userId: bot.user_id },
      }),
    ]);

    if (!subscription) {
      if (!freeTier || (freeTier.freeUrlCredit ?? 0) <= 0) {
        throw new ForbiddenException(
          'No active subscription or free tier credits remaining',
        );
      }
      usesFreeTier = true;
      usesSubscription = false;
    } else if (usesSubscription) {
      const isActive = subscription.endDate
        ? new Date(subscription.endDate) > new Date()
        : false;
      if (!isActive) {
        throw new ForbiddenException('Subscription has expired');
      }
    }

    try {
      const res = await axios.post(`${this.aiServiceUrl}/create-bot`, bot);

      if (
        (res.status === 200 || res.status === 201) &&
        res.data?.status === 'success'
      ) {
        await this.prismaService.bot.create({
          data: {
            id: bot.bot_id,
            name: bot.bot_name,
            model: bot.model ?? 'gemini-2.0-flash',
            userId: bot.user_id,
            temperature: bot.temperature ?? 0.7,
            description: bot.description ?? 'No description provided',
            theme: bot.theme ?? 'default',
            profile_image:
              bot.profile_image ??
              'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-979332_960_720.png',
            prompt_template:
              bot.prompt_template ??
              'You are a helpful assistant. Help based on the context below.',
            kb: {
              create: {
                id: bot.kb_id,
                csv: bot.csv ?? [],
                pdf: bot.pdf ?? [],
                txt: bot.txt ?? [],
                json: bot.json ?? [],
                web_url: bot.web_url ?? [],
                userId: bot.user_id,
              },
            },
          },
        });

        if (usesFreeTier) {
          const updateResult = await this.prismaService.freeTier.updateMany({
            where: {
              userId: bot.user_id,
              freeUrlCredit: { gt: 0 },
            },
            data: {
              freeUrlCredit: {
                decrement: 1,
              },
            },
          });

          if (updateResult.count === 0) {
            throw new ForbiddenException('Free tier credit exhausted');
          }
        }

        this.logger.log(
          `Bot created successfully: ${bot.bot_id} for user ${bot.user_id}`,
        );

        return {
          message: 'Bot created successfully',
          bot_id: bot.bot_id,
          kb_id: bot.kb_id,
          usedFreeTier: usesFreeTier,
        };
      } else {
        throw new InternalServerErrorException(
          res.data?.message || 'AI service failed to index knowledge base',
        );
      }
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      this.logger.error(
        `Failed to create bot ${bot.bot_id}: ${err?.response?.data?.detail || err.message}`,
      );
      throw new InternalServerErrorException(
        err?.response?.data?.detail ||
          'Error communicating with AI service to create bot',
      );
    }
  }

  async getBot(botId: string) {
    const bot = await this.prismaService.bot.findUnique({
      where: {
        id: botId,
      },
      include: {
        kb: true,
      },
    });

    if (!bot) {
      throw new NotFoundException(`Bot with ID '${botId}' not found`);
    }

    return {
      id: bot.id,
      name: bot.name,
      model: bot.model,
      userId: bot.userId,
      description: bot.description,
      private: bot.private,
      theme: bot.theme,
      profile_image: bot.profile_image,
      kb: bot.kb,
    };
  }

  async getAllBots(userId: string) {
    return this.prismaService.bot.findMany({
      where: {
        userId,
      },
      include: {
        kb: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async modifyAccess(data: ModifyAccessDto) {
    const { bot_id, private: isPrivate } = data;

    const bot = await this.prismaService.bot.findUnique({
      where: { id: bot_id },
    });

    if (!bot) {
      throw new NotFoundException(`Bot with ID '${bot_id}' not found`);
    }

    await this.prismaService.bot.update({
      where: { id: bot_id },
      data: {
        private: isPrivate,
      },
    });

    this.logger.log(`Bot ${bot_id} privacy updated to: ${isPrivate}`);
    return {
      message: 'Access modified successfully',
      bot_id,
      private: isPrivate,
    };
  }
}
