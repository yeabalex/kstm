import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { BotEventsListener } from './bot.processor';
import { PrismaService } from '../services/prisma.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'kb-ingestion',
    }),
  ],
  controllers: [BotController],
  providers: [BotService, BotEventsListener, PrismaService],
  exports: [BotService],
})
export class BotModule {}
