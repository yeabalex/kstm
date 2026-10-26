import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateCheckoutSessionDto } from './dto/checkout.dto';

@UseGuards(JwtAuthGuard)
@Controller('/api/v1/subscription')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  async checkout(@Body() checkoutDto: CreateCheckoutSessionDto) {
    const session = await this.stripeService.createCheckoutSession(
      checkoutDto.email,
      checkoutDto.priceId,
      checkoutDto.planId,
    );
    return { url: session.url };
  }
}
