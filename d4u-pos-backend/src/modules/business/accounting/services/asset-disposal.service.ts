import { Injectable } from '@nestjs/common';
import { FixedAssetRepository } from '../repositories/fixed-asset.repository';
import { FixedAssetValidator } from '../validators/fixed-asset.validator';
import { DisposeAssetInput } from '../interfaces/asset-disposal.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { FixedAssetDisposedEvent } from '../events/fixed-asset-disposed.event';

@Injectable()
export class AssetDisposalService {
  constructor(
    private readonly repository: FixedAssetRepository,
    private readonly validator: FixedAssetValidator,
    private readonly eventBus: DomainEventBusService
  ) {}

  async disposeAsset(input: DisposeAssetInput, userId: number) {
    const asset = await this.repository.getAssetById(input.asset_id);
    if (!asset) throw new Error('Asset not found');
    this.validator.validateDisposal(asset, input);

    const disposal = await this.repository.recordDisposal({
      asset_id: input.asset_id,
      disposal_type: input.disposal_type,
      sale_value: input.sale_value,
      reason: input.reason,
      executed_by: userId
    });

    const status = input.disposal_type === 'WRITE_OFF' ? 'WRITTEN_OFF' : 'DISPOSED';
    await this.repository.updateAsset(input.asset_id, {
      status,
      location_id: null, // Removed from active locations
      updated_by: userId
    });

    this.eventBus.publish(new FixedAssetDisposedEvent(
      asset.store_id, 0, userId, disposal.id.toString(), 'asset_disposal', { type: input.disposal_type }
    ));

    return disposal;
  }
}
