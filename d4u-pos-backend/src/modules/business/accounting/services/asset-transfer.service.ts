import { Injectable } from '@nestjs/common';
import { FixedAssetRepository } from '../repositories/fixed-asset.repository';
import { FixedAssetValidator } from '../validators/fixed-asset.validator';
import { TransferAssetInput } from '../interfaces/asset-transfer.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { FixedAssetTransferredEvent } from '../events/fixed-asset-transferred.event';

@Injectable()
export class AssetTransferService {
  constructor(
    private readonly repository: FixedAssetRepository,
    private readonly validator: FixedAssetValidator,
    private readonly eventBus: DomainEventBusService
  ) {}

  async transferAsset(input: TransferAssetInput, userId: number) {
    const asset = await this.repository.getAssetById(input.asset_id);
    if (!asset) throw new Error('Asset not found');
    this.validator.validateTransfer(asset, input);

    const transfer = await this.repository.recordTransfer({
      asset_id: input.asset_id,
      from_location_id: asset.location_id,
      to_location_id: input.to_location_id,
      reason: input.reason,
      executed_by: userId
    });

    await this.repository.updateAsset(input.asset_id, {
      location_id: input.to_location_id,
      status: 'TRANSFERRED',
      updated_by: userId
    });

    this.eventBus.publish(new FixedAssetTransferredEvent(
      asset.store_id, 0, userId, transfer.id.toString(), 'asset_transfer', { from: asset.location_id, to: input.to_location_id }
    ));

    return transfer;
  }
}
