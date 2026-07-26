import { Controller, Get, Post, Put, Body, Param, Query, Patch, Req } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreatePackageDto, OnboardClientDto } from './dto';
import { Public } from '../../../common/decorators';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // PACKAGES
  @Public()
  @Get('package')
  getPackages() {
    return this.subscriptionService.getPackages();
  }

  @Post('package')
  createPackage(@Body() body: CreatePackageDto) {
    return this.subscriptionService.createPackage(body);
  }

  @Put('package/:id')
  updatePackage(@Param('id') id: string, @Body() body: CreatePackageDto) {
    return this.subscriptionService.updatePackage(+id, body);
  }

  @Patch('package/:id/archive')
  archivePackage(@Param('id') id: string) {
    return this.subscriptionService.archivePackage(+id);
  }

  // PRICING (A LA CARTE MODULES)
  @Get('pricing')
  getPricing(@Query('currency') currency: string) {
    return this.subscriptionService.getPricing(currency || 'USD');
  }

  // ONBOARDING
  @Public()
  @Post('onboarding')
  onboardClient(@Body() body: OnboardClientDto) {
    return this.subscriptionService.onboardClient(body);
  }

  // SUBSCRIPTION INFO
  @Get(':brand_id')
  getSubscription(@Param('brand_id') brand_id: string) {
    return this.subscriptionService.getSubscription(+brand_id);
  }

  @Post(':id/renew')
  renewSubscription(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.subscriptionService.renewSubscription(+id, {
      ...body,
      recorded_by: req.user?.sub || 1 // fallback to 1 for super admin
    });
  }

  @Patch(':id/suspend')
  suspendSubscription(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.subscriptionService.suspendSubscription(+id, body);
  }
}
