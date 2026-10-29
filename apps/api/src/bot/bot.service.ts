import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BotStatus } from '@prisma/client';
import { PrismaService } from '../services/prisma.service';
import redis from '../utils/redis';
import { CreateBotDto } from './dto/create-bot.dto';
import { ModifyAccessDto } from './dto/modify-access.dto';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(
    private readonly prismaService: PrismaService,
    @InjectQueue('kb-ingestion') private readonly kbIngestionQueue: Queue,
  ) {}

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
      const promptTemplate =
        bot.prompt_template ??
        'You are a helpful assistant. Help based on the context below.';

      // 1. Create the Bot in Prisma with status: 'INDEXING' and the Kb record
      await this.prismaService.bot.create({
        data: {
          id: bot.bot_id,
          name: bot.bot_name,
          model: bot.model ?? 'gemini-2.5-flash',
          userId: bot.user_id,
          temperature: bot.temperature ?? 0.7,
          description: bot.description ?? 'No description provided',
          theme: bot.theme ?? 'default',
          status: BotStatus.INDEXING,
          profile_image:
            bot.profile_image ??
            'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-979332_960_720.png',
          prompt_template: promptTemplate,
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

      // 2. If usesFreeTier, decrement the credit
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

      // 3. Add a job 'index-kb' to the 'kb-ingestion' queue with deterministic jobId = bot.bot_id
      const job = await this.kbIngestionQueue.add(
        'index-kb',
        {
          bot_id: bot.bot_id,
          kb_id: bot.kb_id,
          user_id: bot.user_id,
          csv: bot.csv ?? [],
          pdf: bot.pdf ?? [],
          txt: bot.txt ?? [],
          json: bot.json ?? [],
          web_url: bot.web_url ?? [],
          prompt_template: promptTemplate,
        },
        {
          jobId: bot.bot_id,
        },
      );

      this.logger.log(
        `Bot created and queued for indexing: ${bot.bot_id} (jobId=${job.id}) for user ${bot.user_id}`,
      );

      // 4. Return immediately with 201 response (non-blocking)
      return {
        message:
          'Bot created successfully. Knowledge base indexing in progress.',
        bot_id: bot.bot_id,
        kb_id: bot.kb_id,
        job_id: job.id,
        status: BotStatus.INDEXING,
        usedFreeTier: usesFreeTier,
      };
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      this.logger.error(`Failed to create bot ${bot.bot_id}: ${err.message}`);
      throw new InternalServerErrorException('Failed to create bot');
    }
  }

  private async findIngestionJobForBot(botId: string) {
    const directJob = await this.kbIngestionQueue.getJob(botId);
    if (directJob) {
      return directJob;
    }

    const recentJobs = await this.kbIngestionQueue.getJobs(
      ['active', 'waiting', 'completed', 'failed', 'delayed'],
      0,
      50,
    );
    return recentJobs.find((job) => job?.data?.bot_id === botId) ?? null;
  }

  async getBotStatus(botId: string) {
    const bot = await this.prismaService.bot.findUnique({
      where: { id: botId },
    });

    if (!bot) {
      throw new NotFoundException(`Bot with ID '${botId}' not found`);
    }

    let currentStatus = bot.status;
    let jobState: string =
      currentStatus === BotStatus.READY
        ? 'completed'
        : currentStatus === BotStatus.FAILED
          ? 'failed'
          : 'waiting';
    let progress = currentStatus === BotStatus.READY ? 100 : 0;
    let errorReason: string | null = null;
    let result: unknown = null;

    try {
      const job = await this.findIngestionJobForBot(botId);
      if (job) {
        jobState = await job.getState();
        if (typeof job.progress === 'number') {
          progress = job.progress;
        }
        result = job.returnvalue ?? null;
        errorReason = job.failedReason ?? null;

        if (jobState === 'completed') {
          progress = 100;
          if (currentStatus !== BotStatus.READY) {
            currentStatus = BotStatus.READY;
            await this.prismaService.bot.update({
              where: { id: botId },
              data: { status: BotStatus.READY },
            });
          }
        } else if (jobState === 'failed') {
          if (currentStatus !== BotStatus.FAILED) {
            currentStatus = BotStatus.FAILED;
            await this.prismaService.bot.update({
              where: { id: botId },
              data: { status: BotStatus.FAILED },
            });
          }
        }
      }

      if (!errorReason && (currentStatus === BotStatus.FAILED || jobState === 'failed')) {
        errorReason = await redis.get(`bot:error:${botId}`).catch(() => null);
      }
    } catch (err) {
      this.logger.warn(
        `Unable to read BullMQ job state for bot ${botId}: ${err.message}`,
      );
    }

    return {
      bot_id: bot.id,
      status: currentStatus,
      job_state: jobState,
      progress,
      error: errorReason,
      result,
    };
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
      user_id: bot.userId,
      description: bot.description,
      private: bot.private,
      theme: bot.theme,
      status: bot.status,
      profile_image: bot.profile_image,
      kb: bot.kb,
    };
  }

  async getAllBots(userId: string) {
    const bots = await this.prismaService.bot.findMany({
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

    // Reconcile any INDEXING bots against BullMQ state in the background without blocking
    await Promise.all(
      bots.map(async (b) => {
        if (b.status === BotStatus.INDEXING) {
          try {
            const statusInfo = await this.getBotStatus(b.id);
            b.status = statusInfo.status;
          } catch {
            // Keep existing status if reconciliation fails
          }
        }
      }),
    );

    return bots;
  }

  async modifyAccess(data: ModifyAccessDto, requesterUserId?: string) {
    const { bot_id, private: isPrivate } = data;

    const bot = await this.prismaService.bot.findUnique({
      where: { id: bot_id },
    });

    if (!bot) {
      throw new NotFoundException(`Bot with ID '${bot_id}' not found`);
    }

    if (requesterUserId && bot.userId !== requesterUserId) {
      throw new ForbiddenException(
        'You do not have permission to modify access for this assistant',
      );
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
