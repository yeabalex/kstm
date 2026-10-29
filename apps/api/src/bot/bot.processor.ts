import {
  QueueEventsHost,
  QueueEventsListener,
  OnQueueEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { BotStatus } from '@prisma/client';
import { PrismaService } from '../services/prisma.service';
import redis from '../utils/redis';

@QueueEventsListener('kb-ingestion')
export class BotEventsListener extends QueueEventsHost {
  private readonly logger = new Logger(BotEventsListener.name);

  constructor(
    private readonly prismaService: PrismaService,
    @InjectQueue('kb-ingestion') private readonly kbQueue: Queue,
  ) {
    super();
  }

  @OnQueueEvent('completed')
  async onCompleted({ jobId }: { jobId: string }) {
    try {
      const job = await this.kbQueue.getJob(jobId);
      const botId = job?.data?.bot_id || jobId;

      if (!botId) {
        this.logger.warn(`Completed job ${jobId} has no bot_id in data`);
        return;
      }

      await redis.del(`bot:error:${botId}`).catch(() => undefined);

      await this.prismaService.bot.update({
        where: { id: botId },
        data: { status: BotStatus.READY },
      });

      this.logger.log(`Bot ${botId} indexing completed. Status set to READY.`);
    } catch (error) {
      this.logger.error(
        `Failed to update status to READY for job ${jobId}: ${error.message}`,
      );
    }
  }

  @OnQueueEvent('failed')
  async onFailed({
    jobId,
    failedReason,
  }: {
    jobId: string;
    failedReason: string;
  }) {
    try {
      const job = await this.kbQueue.getJob(jobId);
      const botId = job?.data?.bot_id || jobId;
      const userId = job?.data?.user_id;

      if (!botId) {
        this.logger.warn(`Failed job ${jobId} has no bot_id in data`);
        return;
      }

      if (failedReason) {
        await redis
          .set(`bot:error:${botId}`, failedReason, 'EX', 3600)
          .catch(() => undefined);
      }

      await this.prismaService.bot.update({
        where: { id: botId },
        data: { status: BotStatus.FAILED },
      });

      if (userId) {
        await this.prismaService.freeTier
          .updateMany({
            where: { userId },
            data: { freeUrlCredit: { increment: 1 } },
          })
          .catch(() => undefined);
      }

      this.logger.error(
        `Bot ${botId} indexing failed (Reason: ${failedReason}). Status set to FAILED.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update status to FAILED for job ${jobId}: ${error.message}`,
      );
    }
  }
}
