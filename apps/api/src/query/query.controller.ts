import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { QueryService } from './query.service';
import { QueryDto } from './dto/query.dto';

@Controller('/api/v1/query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async query(@Body() queryDto: QueryDto) {
    return this.queryService.query(queryDto);
  }
}
