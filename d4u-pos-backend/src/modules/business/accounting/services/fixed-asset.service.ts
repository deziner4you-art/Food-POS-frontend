import { Injectable } from '@nestjs/common';
import { FixedAssetRepository } from '../repositories/fixed-asset.repository';
import { FixedAssetValidator } from '../validators/fixed-asset.validator';
import { CreateFixedAssetInput, UpdateFixedAssetInput } from '../interfaces/fixed-asset.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { FixedAssetCreatedEvent } from '../events/fixed-asset-created.event';

@Injectable()
export class FixedAssetService {
  constructor(
    private readonly repository: FixedAssetRepository,
    private readonly validator: FixedAssetValidator,
    private readonly eventBus: DomainEventBusService
  ) {}

  async createAsset(input: CreateFixedAssetInput, userId: number) {
    await this.validator.validateCreation(input);

    const data = {
      ...input,
      status: input.capitalization_date ? 'ACTIVE' : 'DRAFT',
      created_by: userId
    };

    const asset = await this.repository.createAsset(data);

    this.eventBus.publish(new FixedAssetCreatedEvent(
      asset.store_id, 0, userId, asset.id.toString(), 'asset_creation', { code: asset.code }
    ));

    return asset;
  }

  async getAssets(storeId: number) {
    return this.repository.getAssets(storeId);
  }

  async getAssetById(id: number) {
    return this.repository.getAssetById(id);
  }

  async updateAsset(id: number, input: UpdateFixedAssetInput, userId: number) {
    const data: any = { ...input, updated_by: userId };
    if (input.capitalization_date) {
      data.status = 'ACTIVE';
    }
    return this.repository.updateAsset(id, data);
  }
}
