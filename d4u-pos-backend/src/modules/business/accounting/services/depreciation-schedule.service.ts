import { Injectable } from '@nestjs/common';
import { DepreciationRepository } from '../repositories/depreciation.repository';
import { DepreciationValidator } from '../validators/depreciation.validator';

@Injectable()
export class DepreciationScheduleService {
  constructor(
    private readonly repository: DepreciationRepository,
    private readonly validator: DepreciationValidator
  ) {}

  async calculateMonthlyDepreciation(asset: any, periodStart: Date, periodEnd: Date) {
    this.validator.validateAssetEligibility(asset);
    
    let depreciationMethod = 'STRAIGHT_LINE';
    let currentAccumulated = 0;
    let currentBookValue = Number(asset.purchase_cost);

    if (asset.depreciation) {
      depreciationMethod = asset.depreciation.method;
      currentAccumulated = Number(asset.depreciation.accumulated_amount);
      currentBookValue = Number(asset.depreciation.book_value);
    }

    if (currentBookValue <= Number(asset.residual_value)) return null; // Fully depreciated

    let monthlyDepreciation = 0;

    if (depreciationMethod === 'STRAIGHT_LINE') {
      const depreciableAmount = Number(asset.purchase_cost) - Number(asset.residual_value);
      monthlyDepreciation = depreciableAmount / asset.useful_life;
    } else if (depreciationMethod === 'DECLINING_BALANCE' || depreciationMethod === 'DOUBLE_DECLINING') {
      const rate = asset.depreciation?.rate ? Number(asset.depreciation.rate) : (depreciationMethod === 'DOUBLE_DECLINING' ? (2 / asset.useful_life) : (1 / asset.useful_life));
      monthlyDepreciation = currentBookValue * rate;
    }

    // Adjust for final month so we don't go below residual value
    if (currentBookValue - monthlyDepreciation < Number(asset.residual_value)) {
      monthlyDepreciation = currentBookValue - Number(asset.residual_value);
    }

    return { amount: monthlyDepreciation, method: depreciationMethod };
  }
}
