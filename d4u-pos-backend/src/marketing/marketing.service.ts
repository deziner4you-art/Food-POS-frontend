import { Injectable } from '@nestjs/common';

@Injectable()
export class MarketingService {
  
  // 1. Digital Marketing SLA Target Logic
  calculateSlaPerformance(agencyName: string, baselineTarget: number, achievedOrders: number, retainerFee: number) {
    const BONUS_PER_EXTRA_ORDER = 150; // Rs. 150 bonus per extra order
    const PENALTY_PCT_FOR_MISSING = 5.0; // 5% penalty on retainer fee

    let finalPayout = retainerFee;
    let status = 'MET';
    let bonusOrPenalty = 0;

    if (achievedOrders > baselineTarget) {
      status = 'EXCEEDED';
      const extraOrders = achievedOrders - baselineTarget;
      bonusOrPenalty = extraOrders * BONUS_PER_EXTRA_ORDER;
      finalPayout += bonusOrPenalty;
    } else if (achievedOrders < baselineTarget) {
      status = 'MISSED';
      bonusOrPenalty = -(retainerFee * (PENALTY_PCT_FOR_MISSING / 100));
      finalPayout += bonusOrPenalty;
    }

    return {
      agency: agencyName,
      status,
      baseline_target: baselineTarget,
      achieved: achievedOrders,
      bonus_penalty_amount: bonusOrPenalty,
      final_payout: finalPayout,
      message: status === 'EXCEEDED' ? `Great job! Bonus awarded.` : (status === 'MISSED' ? `Target missed. Penalty applied.` : `Target exactly met.`)
    };
  }

  // 2. Affiliate Marketing Deep-Link Generator (Influencers/Riders/B2B)
  generateAffiliateLink(affiliateId: string, storeId: number, platform: string) {
    // Generates UTM tagged Deep-Link that automatically tracks conversions
    const baseUrl = `https://order.d4u-pos.com/store/${storeId}`;
    const deepLink = `${baseUrl}?utm_source=affiliate_${platform}&aff_id=${affiliateId}`;
    
    return {
      affiliate_id: affiliateId,
      platform,
      deep_link: deepLink,
      qr_code_data: deepLink, // Frontend generates the actual visual QR code from this string
      commission_rule: "5% per successful delivery via this link"
    };
  }
}
