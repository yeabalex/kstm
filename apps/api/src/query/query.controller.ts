import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { QueryService } from './query.service';
import { QueryDto } from './dto/query.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('/api/v1/query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post()
  @Throttle({
    short: { limit: 3, ttl: 1000 },
    long: { limit: 20, ttl: 60000 },
  })
  @HttpCode(HttpStatus.OK)
  async query(@Body() queryDto: QueryDto) {
    return this.queryService.query(queryDto);
  }

  @Get('sessions/:botId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getSessionsByBot(@Param('botId') botId: string) {
    return this.queryService.getSessionsByBot(botId);
  }

  @Get('sessions/:sessionId/messages')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getSessionMessages(@Param('sessionId') sessionId: string) {
    return this.queryService.getSessionMessages(sessionId);
  }
}
