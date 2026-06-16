import { Controller, Post, Body } from '@nestjs/common';
import { MarketingService } from './marketing.service';

@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Post('sla-performance')
  calculateSla(@Body() body: { agency: string, target: number, achieved: number, retainer: number }) {
    return this.marketingService.calculateSlaPerformance(body.agency, body.target, body.achieved, body.retainer);
  }

  @Post('generate-affiliate-link')
  generateLink(@Body() body: { affiliate_id: string, store_id: number, platform: string }) {
    return this.marketingService.generateAffiliateLink(body.affiliate_id, body.store_id, body.platform);
  }
}
