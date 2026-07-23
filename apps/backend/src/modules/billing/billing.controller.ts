// ============================================
// ContentPilot AI — Billing Controller
// ============================================

import { Controller, Get, Post, Body, Req, Res, RawBody, HttpCode, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { BillingService } from './billing.service';
import { CurrentUser, Public } from '../../common/decorators';
import type { SubscriptionPlan } from '@contentpilot/shared';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  async getSubscription(@CurrentUser('id') userId: string) {
    return this.billingService.getSubscription(userId);
  }

  @Post('checkout')
  async createCheckout(
    @CurrentUser('id') userId: string,
    @Body() body: { plan: SubscriptionPlan },
  ) {
    return this.billingService.createCheckoutSession(userId, body.plan);
  }

  @Post('portal')
  async createPortal(@CurrentUser('id') userId: string) {
    return this.billingService.createPortalSession(userId);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Req() req: Request, @Res() res: Response) {
    const signature = req.headers['stripe-signature'] as string;

    try {
      // Note: Need raw body for Stripe webhook verification
      // This requires raw body parsing middleware
      await this.billingService.handleWebhook(req.body as Buffer, signature);
      res.json({ received: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
