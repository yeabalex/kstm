import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    const secretKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') ||
      'sk_test_placeholder';
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-03-31.basil' as any,
    });
    this.appUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('APP_URL') ||
      'http://localhost:3000';
  }

  async createCheckoutSession(email: string, priceId: string, planId: number) {
    this.logger.log(`Creating checkout session for: ${email}, plan: ${planId}`);
    return this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.appUrl}/cancel`,
      metadata: {
        plan_id: String(planId),
      },
    });
  }
}
