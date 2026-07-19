const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/fixed-asset-created.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class FixedAssetCreatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'FIXED_ASSET_CREATED';
  occurred_at = new Date();
  entity_type = 'FIXED_ASSET';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/fixed-asset-transferred.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class FixedAssetTransferredEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'FIXED_ASSET_TRANSFERRED';
  occurred_at = new Date();
  entity_type = 'FIXED_ASSET_TRANSFER';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/fixed-asset-disposed.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class FixedAssetDisposedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'FIXED_ASSET_DISPOSED';
  occurred_at = new Date();
  entity_type = 'FIXED_ASSET_DISPOSAL';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/fixed-asset.interface.ts': `export interface CreateFixedAssetInput {
  store_id: number;
  category_id: number;
  location_id?: number;
  code: string;
  name: string;
  description?: string;
  purchase_date: Date;
  purchase_cost: number;
  capitalization_date?: Date;
  residual_value: number;
  useful_life: number;
  department?: string;
}

export interface UpdateFixedAssetInput {
  name?: string;
  description?: string;
  status?: string;
  department?: string;
  capitalization_date?: Date;
}
`,

  'interfaces/asset-transfer.interface.ts': `export interface TransferAssetInput {
  asset_id: number;
  to_location_id: number;
  reason?: string;
}
`,

  'interfaces/asset-disposal.interface.ts': `export interface DisposeAssetInput {
  asset_id: number;
  disposal_type: 'SALE' | 'WRITE_OFF';
  sale_value?: number;
  reason?: string;
}
`,

  // Repository
  'repositories/fixed-asset.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class FixedAssetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAsset(data: any) {
    return this.prisma.fixedAsset.create({ data });
  }

  async getAssetById(id: number) {
    return this.prisma.fixedAsset.findUnique({
      where: { id },
      include: {
        category: true,
        location: true,
        transfers: { include: { from_location: true, to_location: true } },
        disposal: true
      }
    });
  }

  async getAssetByCode(storeId: number, code: string) {
    return this.prisma.fixedAsset.findUnique({
      where: { code }
    });
  }

  async updateAsset(id: number, data: any) {
    return this.prisma.fixedAsset.update({
      where: { id },
      data
    });
  }

  async getAssets(storeId: number) {
    return this.prisma.fixedAsset.findMany({
      where: { store_id: storeId },
      include: { category: true, location: true }
    });
  }

  async recordTransfer(data: any) {
    return this.prisma.assetTransfer.create({ data });
  }

  async recordDisposal(data: any) {
    return this.prisma.assetDisposal.create({ data });
  }
}
`,

  // Validator
  'validators/fixed-asset.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateFixedAssetInput } from '../interfaces/fixed-asset.interface';
import { TransferAssetInput } from '../interfaces/asset-transfer.interface';
import { DisposeAssetInput } from '../interfaces/asset-disposal.interface';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class FixedAssetValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateCreation(input: CreateFixedAssetInput) {
    if (!input.code || !input.name) throw new BadRequestException('Asset code and name are required');
    if (input.purchase_cost <= 0) throw new BadRequestException('Purchase cost must be > 0');
    if (input.useful_life <= 0) throw new BadRequestException('Useful life must be > 0');
    if (input.residual_value > input.purchase_cost) throw new BadRequestException('Residual value cannot exceed purchase cost');
    
    const existing = await this.prisma.fixedAsset.findUnique({ where: { code: input.code } });
    if (existing) throw new BadRequestException('Asset code must be unique');

    const category = await this.prisma.fixedAssetCategory.findUnique({ where: { id: input.category_id } });
    if (!category) throw new BadRequestException('Invalid asset category');

    if (input.location_id) {
      const location = await this.prisma.assetLocation.findUnique({ where: { id: input.location_id, store_id: input.store_id } });
      if (!location) throw new BadRequestException('Invalid asset location');
    }
  }

  validateTransfer(asset: any, input: TransferAssetInput) {
    if (!asset) throw new BadRequestException('Asset not found');
    if (asset.status === 'DISPOSED' || asset.status === 'WRITTEN_OFF') {
      throw new BadRequestException('Disposed assets cannot be transferred');
    }
    if (asset.location_id === input.to_location_id) {
      throw new BadRequestException('Asset is already at the target location');
    }
  }

  validateDisposal(asset: any, input: DisposeAssetInput) {
    if (!asset) throw new BadRequestException('Asset not found');
    if (asset.status === 'DISPOSED' || asset.status === 'WRITTEN_OFF') {
      throw new BadRequestException('Asset is already disposed');
    }
    if (input.disposal_type === 'SALE' && (input.sale_value === undefined || input.sale_value < 0)) {
      throw new BadRequestException('Sale value is required and cannot be negative for SALE type');
    }
  }
}
`,

  // Services
  'services/fixed-asset.service.ts': `import { Injectable } from '@nestjs/common';
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
`,

  'services/asset-transfer.service.ts': `import { Injectable } from '@nestjs/common';
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
`,

  'services/asset-disposal.service.ts': `import { Injectable } from '@nestjs/common';
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
`,

  // Controllers
  'controllers/fixed-asset.controller.ts': `import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { FixedAssetService } from '../services/fixed-asset.service';
import { AssetTransferService } from '../services/asset-transfer.service';
import { AssetDisposalService } from '../services/asset-disposal.service';

@Controller('accounting/fixed-assets')
export class FixedAssetController {
  constructor(
    private readonly assetService: FixedAssetService,
    private readonly transferService: AssetTransferService,
    private readonly disposalService: AssetDisposalService
  ) {}

  @Post()
  async createAsset(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.assetService.createAsset(body, userId);
  }

  @Get()
  async getAssets(@Query('store_id') storeId: string) {
    return this.assetService.getAssets(Number(storeId));
  }

  @Get(':id')
  async getAssetById(@Param('id') id: string) {
    return this.assetService.getAssetById(Number(id));
  }

  @Patch(':id')
  async updateAsset(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.assetService.updateAsset(Number(id), body, userId);
  }

  @Post('transfer')
  async transferAsset(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.transferService.transferAsset(body, userId);
  }

  @Post('dispose')
  async disposeAsset(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.disposalService.disposeAsset(body, userId);
  }
}
`
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
