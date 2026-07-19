import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
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
      throw new BadRequestException(`No active accounting rule configured for ${context.event_type}`);
    }

    const rule = rules[0];

    // Resolve Debit Account
    const debitMapping = await this.mappingService.findByType(context.store_id, rule.debit_account_resolver as any);
    if (!debitMapping) {
      throw new BadRequestException(`Debit System Account Mapping ${rule.debit_account_resolver} not configured.`);
    }

    // Resolve Credit Account
    const creditMapping = await this.mappingService.findByType(context.store_id, rule.credit_account_resolver as any);
    if (!creditMapping) {
      throw new BadRequestException(`Credit System Account Mapping ${rule.credit_account_resolver} not configured.`);
    }

    return {
      rule,
      debit_account_id: debitMapping.account_id,
      credit_account_id: creditMapping.account_id,
    };
  }
}
