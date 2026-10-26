import { Module } from '@nestjs/common';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { PrismaService } from '../services/prisma.service';

@Module({
  imports: [],
  controllers: [BotController],
  providers: [BotService, PrismaService],
})
export class BotModule {}
