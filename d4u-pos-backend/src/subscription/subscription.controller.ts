import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('pricing')
  getPricing() {
    return this.subscriptionService.getPricing();
  }

  @Post('onboarding')
  async onboardClient(@Body() body: any) {
    try {
      return await this.subscriptionService.onboardClient(body);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return { success: false, message: 'An account with this phone number already exists.' };
      }
      return { success: false, message: error.message || 'Server error during setup.' };
    }
  }

  @Get(':brand_id')
  getSubscription(@Param('brand_id') brand_id: string) {
    return this.subscriptionService.getSubscription(Number(brand_id));
  }

  @Post()
  updateSubscription(@Body() body: any) {
    return this.subscriptionService.createOrUpdateSubscription(body);
  }
}
