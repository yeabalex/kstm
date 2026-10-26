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
      const botId = job?.data?.bot_id;

      if (!botId) {
        this.logger.warn(`Completed job ${jobId} has no bot_id in data`);
        return;
      }

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
      const botId = job?.data?.bot_id;

      if (!botId) {
        this.logger.warn(`Failed job ${jobId} has no bot_id in data`);
        return;
      }

      await this.prismaService.bot.update({
        where: { id: botId },
        data: { status: BotStatus.FAILED },
      });

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
