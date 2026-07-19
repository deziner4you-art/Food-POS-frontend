const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Interfaces
  'interfaces/posting-rule.interface.ts': `export interface PostingRule {
  id: number;
  rule_code: string;
  rule_name: string;
  trigger_event: string;
  debit_account_resolver: string;
  credit_account_resolver: string;
  currency_strategy: string;
  tax_strategy: string;
  cost_center_strategy?: string;
  profit_center_strategy?: string;
  auto_post: boolean;
  is_active: boolean;
  priority: number;
}
`,

  'interfaces/posting-context.interface.ts': `export interface PostingContext {
  store_id: number;
  tenant_id: number;
  event_type: string;
  amount: number;
  currency_id?: number;
  tax_amount?: number;
  reference_id?: string;
  metadata?: Record<string, any>;
}
`,

  // DTOs
  'dto/create-posting-rule.dto.ts': `import { IsString, IsBoolean, IsOptional, IsInt, IsNotEmpty } from 'class-validator';

export class CreatePostingRuleDto {
  @IsString()
  @IsNotEmpty()
  rule_code: string;

  @IsString()
  @IsNotEmpty()
  rule_name: string;

  @IsString()
  @IsNotEmpty()
  trigger_event: string;

  @IsString()
  @IsNotEmpty()
  debit_account_resolver: string;

  @IsString()
  @IsNotEmpty()
  credit_account_resolver: string;

  @IsString()
  currency_strategy: string;

  @IsString()
  tax_strategy: string;

  @IsOptional()
  @IsString()
  cost_center_strategy?: string;

  @IsOptional()
  @IsString()
  profit_center_strategy?: string;

  @IsOptional()
  @IsBoolean()
  auto_post?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsInt()
  priority?: number;
}
`,

  'dto/update-posting-rule.dto.ts': `import { IsString, IsBoolean, IsOptional, IsInt } from 'class-validator';

export class UpdatePostingRuleDto {
  @IsOptional()
  @IsString()
  rule_name?: string;

  @IsOptional()
  @IsString()
  trigger_event?: string;

  @IsOptional()
  @IsString()
  debit_account_resolver?: string;

  @IsOptional()
  @IsString()
  credit_account_resolver?: string;

  @IsOptional()
  @IsString()
  currency_strategy?: string;

  @IsOptional()
  @IsString()
  tax_strategy?: string;

  @IsOptional()
  @IsString()
  cost_center_strategy?: string;

  @IsOptional()
  @IsString()
  profit_center_strategy?: string;

  @IsOptional()
  @IsBoolean()
  auto_post?: boolean;

  @IsOptional()
  @IsInt()
  priority?: number;
}
`,

  // Validators
  'validators/posting-rule.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

export const SUPPORTED_RULE_TYPES = [
  'POS_SALE',
  'POS_REFUND',
  'INVENTORY_ADJUSTMENT',
  'PURCHASE_INVOICE',
  'PURCHASE_RETURN',
  'CASH_RECEIPT',
  'CASH_PAYMENT',
  'BANK_RECEIPT',
  'BANK_PAYMENT',
  'PAYROLL',
  'SUBSCRIPTION',
  'MANUAL_JOURNAL',
];

@Injectable()
export class PostingRuleValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateCreation(storeId: number, dto: any) {
    if (!SUPPORTED_RULE_TYPES.includes(dto.trigger_event)) {
      throw new BadRequestException(\`Trigger event \${dto.trigger_event} is not a supported type.\`);
    }

    const existing = await this.prisma.postingRule.findFirst({
      where: { store_id: storeId, rule_code: dto.rule_code },
    });
    
    if (existing) {
      throw new BadRequestException('Rule Code must be unique per store.');
    }

    // Ensure negative priority is rejected or something. We'll just enforce standard bounds
    if (dto.priority < 0) {
      throw new BadRequestException('Priority cannot be negative.');
    }
  }

  async validateContext(context: any) {
    if (!context.store_id || !context.event_type) {
      throw new BadRequestException('Posting context missing required store or event_type.');
    }
  }
}
`,

  // Repository
  'repositories/posting-rule.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostingRuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, data: Omit<Prisma.PostingRuleUncheckedCreateInput, 'store_id'>) {
    return this.prisma.postingRule.create({
      data: { ...data, store_id: storeId },
    });
  }

  async update(storeId: number, id: number, data: Prisma.PostingRuleUncheckedUpdateInput) {
    return this.prisma.postingRule.update({
      where: { id, store_id: storeId },
      data,
    });
  }

  async findByCode(storeId: number, ruleCode: string) {
    return this.prisma.postingRule.findUnique({
      where: { store_id_rule_code: { store_id: storeId, rule_code: ruleCode } },
    });
  }

  async findActiveRulesByTrigger(storeId: number, triggerEvent: string) {
    return this.prisma.postingRule.findMany({
      where: { store_id: storeId, trigger_event: triggerEvent, is_active: true },
      orderBy: { priority: 'desc' },
    });
  }

  async findAll(storeId: number) {
    return this.prisma.postingRule.findMany({
      where: { store_id: storeId },
      orderBy: { priority: 'desc' },
    });
  }

  async findById(storeId: number, id: number) {
    return this.prisma.postingRule.findFirst({
      where: { id, store_id: storeId },
    });
  }
}
`,

  // Service
  'services/accounting-rules.service.ts': `import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PostingRuleRepository } from '../repositories/posting-rule.repository';
import { SystemAccountMappingService } from './system-account-mapping.service';
import { PostingRuleValidator } from '../validators/posting-rule.validator';
import { CreatePostingRuleDto } from '../dto/create-posting-rule.dto';
import { UpdatePostingRuleDto } from '../dto/update-posting-rule.dto';
import { PostingContext } from '../interfaces/posting-context.interface';

@Injectable()
export class AccountingRulesService {
  private readonly logger = new Logger(AccountingRulesService.name);

  constructor(
    private readonly repo: PostingRuleRepository,
    private readonly mappingService: SystemAccountMappingService,
    private readonly validator: PostingRuleValidator,
  ) {}

  async createRule(storeId: number, dto: CreatePostingRuleDto) {
    await this.validator.validateCreation(storeId, dto);
    return this.repo.create(storeId, dto);
  }

  async updateRule(storeId: number, id: number, dto: UpdatePostingRuleDto) {
    const existing = await this.repo.findById(storeId, id);
    if (!existing) throw new NotFoundException('Rule not found.');
    return this.repo.update(storeId, id, dto);
  }

  async activateRule(storeId: number, id: number) {
    return this.updateRule(storeId, id, { is_active: true } as any);
  }

  async deactivateRule(storeId: number, id: number) {
    return this.updateRule(storeId, id, { is_active: false } as any);
  }

  async getRule(storeId: number, id: number) {
    const existing = await this.repo.findById(storeId, id);
    if (!existing) throw new NotFoundException('Rule not found.');
    return existing;
  }

  async getRules(storeId: number) {
    return this.repo.findAll(storeId);
  }

  // Engine Resolution Logic
  async resolveAccountsForEvent(context: PostingContext) {
    await this.validator.validateContext(context);
    
    // Find highest priority active rule for the event
    const rules = await this.repo.findActiveRulesByTrigger(context.store_id, context.event_type);
    
    if (!rules || rules.length === 0) {
      throw new BadRequestException(\`No active accounting rule configured for \${context.event_type}\`);
    }

    const rule = rules[0];

    // Resolve Debit Account
    const debitMapping = await this.mappingService.findByType(context.store_id, rule.debit_account_resolver as any);
    if (!debitMapping) {
      throw new BadRequestException(\`Debit System Account Mapping \${rule.debit_account_resolver} not configured.\`);
    }

    // Resolve Credit Account
    const creditMapping = await this.mappingService.findByType(context.store_id, rule.credit_account_resolver as any);
    if (!creditMapping) {
      throw new BadRequestException(\`Credit System Account Mapping \${rule.credit_account_resolver} not configured.\`);
    }

    return {
      rule,
      debit_account_id: debitMapping.account_id,
      credit_account_id: creditMapping.account_id,
    };
  }
}
`,

  // Controller
  'controllers/accounting-rules.controller.ts': `import { Controller, Get, Post, Put, Patch, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { AccountingRulesService } from '../services/accounting-rules.service';
import { CreatePostingRuleDto } from '../dto/create-posting-rule.dto';
import { UpdatePostingRuleDto } from '../dto/update-posting-rule.dto';

@Controller('accounting/rules')
export class AccountingRulesController {
  constructor(private readonly service: AccountingRulesService) {}

  @Post()
  async createRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreatePostingRuleDto,
  ) {
    return this.service.createRule(store_id, dto);
  }

  @Patch(':id')
  async updateRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostingRuleDto,
  ) {
    return this.service.updateRule(store_id, id, dto);
  }

  @Patch(':id/activate')
  async activateRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.activateRule(store_id, id);
  }

  @Patch(':id/deactivate')
  async deactivateRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deactivateRule(store_id, id);
  }

  @Get(':id')
  async getRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getRule(store_id, id);
  }

  @Get()
  async listRules(
    @Query('store_id', ParseIntPipe) store_id: number,
  ) {
    return this.service.getRules(store_id);
  }
}
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
