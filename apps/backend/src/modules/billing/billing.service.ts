// ============================================
// ContentPilot AI — Billing Service (Stripe)
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';
import { PLAN_LIMITS, type SubscriptionPlan } from '@contentpilot/shared';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const secretKey = config.get<string>('STRIPE_SECRET_KEY');
    if (secretKey) {
      this.stripe = new Stripe(secretKey, { apiVersion: '2025-06-30' as any });
    } else {
      this.logger.warn('Stripe is not configured. Set STRIPE_SECRET_KEY.');
    }
  }

  async getSubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
    });
  }

  async createCheckoutSession(userId: string, plan: SubscriptionPlan) {
    if (!this.stripe) throw new Error('Stripe not configured');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Get or create Stripe customer
    let subscription = await this.prisma.subscription.findUnique({ where: { userId } });
    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId },
      });
      customerId = customer.id;

      if (subscription) {
        await this.prisma.subscription.update({
          where: { userId },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    // Get price ID for the plan
    const priceMap: Record<string, string | undefined> = {
      PRO: this.config.get('STRIPE_PRO_PRICE_ID'),
      AGENCY: this.config.get('STRIPE_AGENCY_PRICE_ID'),
    };

    const priceId = priceMap[plan];
    if (!priceId) throw new Error(`No price configured for plan: ${plan}`);

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.config.get('APP_URL')}/billing?success=true`,
      cancel_url: `${this.config.get('APP_URL')}/billing?canceled=true`,
      metadata: { userId, plan },
    });

    return { url: session.url };
  }

  async createPortalSession(userId: string) {
    if (!this.stripe) throw new Error('Stripe not configured');

    const subscription = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!subscription?.stripeCustomerId) throw new Error('No Stripe customer found');

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${this.config.get('APP_URL')}/billing`,
    });

    return { url: session.url };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    if (!this.stripe) throw new Error('Stripe not configured');

    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET')!;
    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutComplete(session);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdate(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionCanceled(sub);
        break;
      }
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as SubscriptionPlan;
    if (!userId || !plan) return;

    const limits = PLAN_LIMITS[plan];

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        plan,
        status: 'ACTIVE',
        stripeSubscriptionId: session.subscription as string,
        messagesLimit: limits.messages,
        documentsLimit: limits.documents,
        messagesUsed: 0,
      },
    });

    this.logger.log(`User ${userId} upgraded to ${plan}`);
  }

  private async handleSubscriptionUpdate(sub: Stripe.Subscription) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: sub.id },
      data: {
        status: sub.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      },
    });
  }

  private async handleSubscriptionCanceled(sub: Stripe.Subscription) {
    const limits = PLAN_LIMITS.FREE;

    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: sub.id },
      data: {
        plan: 'FREE',
        status: 'CANCELED',
        messagesLimit: limits.messages,
        documentsLimit: limits.documents,
      },
    });
  }
}
