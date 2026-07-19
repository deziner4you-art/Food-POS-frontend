import { Injectable } from '@nestjs/common';
import { DepreciationRepository } from '../repositories/depreciation.repository';
import { DepreciationScheduleService } from './depreciation-schedule.service';
import { RunDepreciationInput } from '../interfaces/depreciation.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { DepreciationCalculatedEvent } from '../events/depreciation-calculated.event';
import { AssetFullyDepreciatedEvent } from '../events/asset-fully-depreciated.event';

@Injectable()
export class DepreciationService {
  constructor(
    private readonly repository: DepreciationRepository,
    private readonly scheduleService: DepreciationScheduleService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async runMonthlyDepreciation(input: RunDepreciationInput, userId: number) {
    const assets = await this.repository.getActiveAssetsForDepreciation(input.store_id);
    const results = [];

    for (const asset of assets) {
      const calcResult = await this.scheduleService.calculateMonthlyDepreciation(asset, new Date(input.period_start), new Date(input.period_end));
      if (!calcResult || calcResult.amount <= 0) continue;

      let currentAccumulated = asset.depreciation ? Number(asset.depreciation.accumulated_amount) : 0;
      let currentBookValue = asset.depreciation ? Number(asset.depreciation.book_value) : Number(asset.purchase_cost);

      const newAccumulated = currentAccumulated + calcResult.amount;
      const newBookValue = currentBookValue - calcResult.amount;

      const ad = await this.repository.createOrUpdateAssetDepreciation({
        asset_id: asset.id,
        method: calcResult.method,
        accumulated_amount: newAccumulated,
        book_value: newBookValue,
        last_depreciation_date: new Date(input.period_end)
      });

      const schedule = await this.repository.createSchedule({
        asset_depreciation_id: ad.id,
        period_start: new Date(input.period_start),
        period_end: new Date(input.period_end),
        amount: calcResult.amount
      });

      this.eventBus.publish(new DepreciationCalculatedEvent(
        input.store_id, 0, userId, schedule.id.toString(), 'depreciation_calculated', { asset_id: asset.id, amount: calcResult.amount }
      ));

      if (newBookValue <= Number(asset.residual_value)) {
        this.eventBus.publish(new AssetFullyDepreciatedEvent(
          input.store_id, 0, userId, asset.id.toString(), 'asset_fully_depreciated', { asset_id: asset.id }
        ));
      }

      results.push(schedule);
    }

    return results;
  }

  async getDepreciationHistory(assetId: number) {
    return this.repository.getDepreciationHistory(assetId);
  }

  async getPendingSchedules(storeId: number, periodEnd: Date) {
    return this.repository.getPendingSchedules(storeId, new Date(periodEnd));
  }
}
