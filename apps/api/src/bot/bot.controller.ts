import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  UseGuards,
  Param,
  Query,
  Patch,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BotService } from './bot.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateBotDto } from './dto/create-bot.dto';
import { ModifyAccessDto } from './dto/modify-access.dto';

interface AuthenticatedRequest {
  user?: {
    userId?: string;
    email?: string;
  };
}

@Controller('/api/v1/bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllBots(
    @Query('userId') userId: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const targetUserId = userId || req?.user?.userId;
    if (!targetUserId) {
      throw new BadRequestException('Missing userId in query parameters');
    }
    if (req?.user?.userId && req.user.userId !== targetUserId) {
      throw new ForbiddenException('Cannot access assistants belonging to another user');
    }
    return this.botService.getAllBots(targetUserId);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @Throttle({
    short: { limit: 2, ttl: 1000 },
    long: { limit: 10, ttl: 60000 },
  })
  @HttpCode(HttpStatus.CREATED)
  async createBot(
    @Body() createBotDto: CreateBotDto,
    @Req() req?: AuthenticatedRequest,
  ) {
    if (req?.user?.userId && req.user.userId !== createBotDto.user_id) {
      throw new ForbiddenException('Cannot create an assistant for another user');
    }
    return this.botService.createBot(createBotDto);
  }

  @Get('/:bot_id/status')
  async getBotStatus(@Param('bot_id') botId: string) {
    return this.botService.getBotStatus(botId);
  }

  @Get('/:bot_id')
  async getBot(@Param('bot_id') botId: string) {
    return this.botService.getBot(botId);
  }

  @Patch('modify-access')
  @UseGuards(JwtAuthGuard)
  async modifyAccess(
    @Body() modifyAccessDto: ModifyAccessDto,
    @Req() req?: AuthenticatedRequest,
  ) {
    return this.botService.modifyAccess(modifyAccessDto, req?.user?.userId);
  }
}
