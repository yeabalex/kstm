import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { PrismaService } from '../services/prisma.service';
import { StripeWebhookController } from './stripe.webhook';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Module({
  imports: [],
  controllers: [StripeController, StripeWebhookController],
  providers: [StripeService, PrismaService, JwtAuthGuard],
})
export class StripeModule {}
