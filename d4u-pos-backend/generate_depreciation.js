const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/depreciation-calculated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class DepreciationCalculatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'DEPRECIATION_CALCULATED';
  occurred_at = new Date();
  entity_type = 'DEPRECIATION';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/depreciation-posted.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class DepreciationPostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'DEPRECIATION_POSTED';
  occurred_at = new Date();
  entity_type = 'DEPRECIATION_POSTING';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/asset-fully-depreciated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class AssetFullyDepreciatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'ASSET_FULLY_DEPRECIATED';
  occurred_at = new Date();
  entity_type = 'ASSET';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/depreciation.interface.ts': `export interface RunDepreciationInput {
  store_id: number;
  period_start: Date;
  period_end: Date;
}
`,

  'interfaces/depreciation-schedule.interface.ts': `export interface GenerateScheduleInput {
  asset_id: number;
  method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'DOUBLE_DECLINING';
  rate?: number;
}
`,

  'interfaces/depreciation-posting.interface.ts': `export interface PostDepreciationInput {
  schedule_id: number;
  depreciation_expense_account_id: number;
  accumulated_depreciation_account_id: number;
}
`,

  // Repository
  'repositories/depreciation.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class DepreciationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveAssetsForDepreciation(storeId: number) {
    return this.prisma.fixedAsset.findMany({
      where: {
        store_id: storeId,
        status: 'ACTIVE',
        capitalization_date: { not: null }
      },
      include: { depreciation: true }
    });
  }

  async getAssetDepreciation(assetId: number) {
    return this.prisma.assetDepreciation.findUnique({
      where: { asset_id: assetId },
      include: { asset: true }
    });
  }

  async createOrUpdateAssetDepreciation(data: any) {
    return this.prisma.assetDepreciation.upsert({
      where: { asset_id: data.asset_id },
      update: {
        accumulated_amount: data.accumulated_amount,
        book_value: data.book_value,
        last_depreciation_date: data.last_depreciation_date
      },
      create: data
    });
  }

  async createSchedule(data: any) {
    return this.prisma.depreciationSchedule.create({ data });
  }

  async getPendingSchedules(storeId: number, periodEnd: Date) {
    return this.prisma.depreciationSchedule.findMany({
      where: {
        is_posted: false,
        period_end: { lte: periodEnd },
        asset_depreciation: { asset: { store_id: storeId } }
      },
      include: { asset_depreciation: { include: { asset: true } } }
    });
  }

  async getScheduleById(scheduleId: number) {
    return this.prisma.depreciationSchedule.findUnique({
      where: { id: scheduleId },
      include: { asset_depreciation: { include: { asset: true } } }
    });
  }

  async recordPosting(data: any) {
    return this.prisma.$transaction(async (tx) => {
      const posting = await tx.depreciationPosting.create({ data });
      await tx.depreciationSchedule.update({
        where: { id: data.schedule_id },
        data: { is_posted: true }
      });
      return posting;
    });
  }

  async getDepreciationHistory(assetId: number) {
    return this.prisma.assetDepreciation.findUnique({
      where: { asset_id: assetId },
      include: { schedules: { include: { posting: true } } }
    });
  }
}
`,

  // Validator
  'validators/depreciation.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class DepreciationValidator {
  constructor(private readonly prisma: PrismaService) {}

  validateAssetEligibility(asset: any) {
    if (asset.status !== 'ACTIVE') throw new BadRequestException(\`Asset \${asset.code} is not ACTIVE\`);
    if (!asset.capitalization_date) throw new BadRequestException(\`Asset \${asset.code} is not capitalized\`);
    if (asset.useful_life <= 0) throw new BadRequestException(\`Asset \${asset.code} has invalid useful life\`);
    if (Number(asset.purchase_cost) <= Number(asset.residual_value)) throw new BadRequestException(\`Asset \${asset.code} residual value exceeds or equals purchase cost\`);
  }

  validatePosting(schedule: any) {
    if (!schedule) throw new BadRequestException('Schedule not found');
    if (schedule.is_posted) throw new BadRequestException('Schedule is already posted');
    if (schedule.asset_depreciation.asset.status === 'DISPOSED' || schedule.asset_depreciation.asset.status === 'WRITTEN_OFF') {
      throw new BadRequestException('Cannot post depreciation for a disposed asset');
    }
  }
}
`,

  // Services
  'services/depreciation-schedule.service.ts': `import { Injectable } from '@nestjs/common';
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
`,

  'services/depreciation-posting.service.ts': `import { Injectable } from '@nestjs/common';
import { DepreciationRepository } from '../repositories/depreciation.repository';
import { DepreciationValidator } from '../validators/depreciation.validator';
import { JournalEntryService } from './journal-entry.service';
import { PostDepreciationInput } from '../interfaces/depreciation-posting.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { DepreciationPostedEvent } from '../events/depreciation-posted.event';

@Injectable()
export class DepreciationPostingService {
  constructor(
    private readonly repository: DepreciationRepository,
    private readonly validator: DepreciationValidator,
    private readonly journalService: JournalEntryService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async postDepreciation(input: PostDepreciationInput, userId: number) {
    const schedule = await this.repository.getScheduleById(input.schedule_id);
    this.validator.validatePosting(schedule);

    const asset = schedule.asset_depreciation.asset;

    // Create Journal Entry
    const journalDto = {
      store_id: asset.store_id,
      fiscal_year_id: 1, // In real implementation, this would be looked up based on schedule.period_end
      period_id: 1,      // Ditto
      currency_id: 1,    // Ditto
      entry_date: schedule.period_end,
      reference: \`DEPR-\${asset.code}-\${schedule.id}\`,
      description: \`Depreciation for \${asset.code}\`,
      lines: [
        {
          account_id: input.depreciation_expense_account_id,
          debit: Number(schedule.amount),
          credit: 0
        },
        {
          account_id: input.accumulated_depreciation_account_id,
          debit: 0,
          credit: Number(schedule.amount)
        }
      ]
    };

    const je = await this.journalService.createJournalEntry(journalDto, userId);
    // Post the journal immediately (or leave it draft, but usually depreciation runs post directly)
    await this.journalService.postToLedger(je.id, userId);

    const posting = await this.repository.recordPosting({
      asset_depreciation_id: schedule.asset_depreciation_id,
      schedule_id: schedule.id,
      journal_entry_id: je.id,
      posting_date: new Date(),
      amount: schedule.amount,
      executed_by: userId
    });

    this.eventBus.publish(new DepreciationPostedEvent(
      asset.store_id, 0, userId, posting.id.toString(), 'depreciation_posted', { amount: posting.amount }
    ));

    return posting;
  }
}
`,

  'services/depreciation.service.ts': `import { Injectable } from '@nestjs/common';
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
`,

  // Controllers
  'controllers/depreciation.controller.ts': `import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { DepreciationService } from '../services/depreciation.service';
import { DepreciationPostingService } from '../services/depreciation-posting.service';

@Controller('accounting/depreciation')
export class DepreciationController {
  constructor(
    private readonly depreciationService: DepreciationService,
    private readonly postingService: DepreciationPostingService
  ) {}

  @Post('run')
  async runDepreciation(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.depreciationService.runMonthlyDepreciation(body, userId);
  }

  @Post('post')
  async postDepreciation(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.postingService.postDepreciation(body, userId);
  }

  @Get('pending')
  async getPendingSchedules(@Query('store_id') storeId: string, @Query('period_end') periodEnd: string) {
    return this.depreciationService.getPendingSchedules(Number(storeId), new Date(periodEnd));
  }

  @Get(':assetId')
  async getDepreciationHistory(@Param('assetId') assetId: string) {
    return this.depreciationService.getDepreciationHistory(Number(assetId));
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
