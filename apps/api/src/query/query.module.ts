import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
//import { JwtAuthGuard } from "src/auth/jwt.guard";
import { QueryService } from './query.service';
import { PrismaService } from '../services/prisma.service';

@Module({
  controllers: [QueryController],
  providers: [QueryService, PrismaService],
  imports: [],
})
export class QueryModule {}
