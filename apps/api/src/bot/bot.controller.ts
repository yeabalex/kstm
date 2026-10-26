import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Param,
  Query,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BotService } from './bot.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateBotDto } from './dto/create-bot.dto';
import { ModifyAccessDto } from './dto/modify-access.dto';

@Controller('/api/v1/bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Get()
  async getAllBots(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('Missing userId in query parameters');
    }
    return this.botService.getAllBots(userId);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBot(@Body() createBotDto: CreateBotDto) {
    return this.botService.createBot(createBotDto);
  }

  @Get('/:bot_id')
  async getBot(@Param('bot_id') botId: string) {
    return this.botService.getBot(botId);
  }

  @Patch('modify-access')
  @UseGuards(JwtAuthGuard)
  async modifyAccess(@Body() modifyAccessDto: ModifyAccessDto) {
    return this.botService.modifyAccess(modifyAccessDto);
  }
}
