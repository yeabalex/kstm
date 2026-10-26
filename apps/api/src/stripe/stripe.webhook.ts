import {
  Controller,
  Post,
  Req,
  Res,
  RawBodyRequest,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../services/prisma.service';
import redis from '../utils/redis';

@Controller('stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const stripeKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') ||
      'sk_test_placeholder';
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-03-31.basil' as any,
    });
    this.webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      this.logger.warn('Missing stripe-signature header in webhook request');
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Missing Stripe signature');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'] || (req as any).body,
        sig,
        this.webhookSecret,
      );
    } catch (err) {
      this.logger.error(
        `Webhook signature verification failed: ${err.message}`,
      );
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event);
          break;
        case 'invoice.paid':
          this.logger.log('Invoice payment confirmed by Stripe');
          break;
        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`);
      }

      return res.status(HttpStatus.OK).json({ received: true });
    } catch (error) {
      this.logger.error(
        `Error processing webhook ${event.type}: ${error.message}`,
      );
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(`Server Error: ${error.message}`);
    }
  }

  private async handleCheckoutSessionCompleted(
    event: Stripe.Event,
  ): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_email;
    if (!email) {
      throw new Error('Missing customer email in checkout session');
    }

    const stripeSubscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id || '';

    const planId = parseInt(session.metadata?.plan_id || '0', 10);
    if (!planId) {
      throw new Error('Missing or invalid plan_id in session metadata');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error(`User not found for email: ${email}`);
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);

    const subscriptionData = {
      userId: user.id,
      planId,
      status: session.payment_status,
      startDate,
      endDate,
      canceledAt: null,
      autoRenew: true,
      stripeSubscriptionId,
    };

    // Atomic DB transaction for subscription & payment record
    await this.prisma.$transaction(async (tx) => {
      const existingSub = await tx.userSubscription.findFirst({
        where: { userId: user.id },
      });

      if (existingSub) {
        await tx.userSubscription.update({
          where: { id: existingSub.id },
          data: subscriptionData,
        });
      } else {
        await tx.userSubscription.create({ data: subscriptionData });
      }

      await tx.subscriptionPayment.create({
        data: {
          userId: user.id,
          amount: (session.amount_total ?? 0) / 100,
          currency: session.currency || 'usd',
          status: session.payment_status,
          paymentDate: startDate,
          paymentMethod: session.payment_method_types?.[0] || 'card',
          paymentProcessor: 'stripe',
          stripeInvoiceId:
            typeof session.invoice === 'string' ? session.invoice : '',
          stripePaymentIntentId: session.payment_intent?.toString() || '',
          transactionId: session.id,
          receiptUrl: '',
        },
      });
    });

    this.logger.log(`Subscription activated in DB for user ${user.id}`);

    // Redis caching
    const cacheKey = `subscription:${user.id}`;
    const ttlSeconds = Math.floor(
      (endDate.getTime() - startDate.getTime()) / 1000,
    );

    if (ttlSeconds > 0) {
      try {
        await redis.set(
          cacheKey,
          JSON.stringify(subscriptionData),
          'EX',
          ttlSeconds,
        );
        this.logger.log(`Cached subscription state for user ${user.id}`);
      } catch (cacheErr) {
        this.logger.warn(
          `Failed to cache subscription to Redis: ${cacheErr.message}`,
        );
      }
    }
  }
}
