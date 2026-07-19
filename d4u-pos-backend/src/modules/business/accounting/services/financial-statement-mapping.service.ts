import { Injectable } from '@nestjs/common';
import { FinancialStatementRepository } from '../repositories/financial-statement.repository';
import { FinancialStatementValidator } from '../validators/financial-statement.validator';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { FinancialStatementMappingCreatedEvent } from '../events/financial-statement-mapping-created.event';
import { CreateStatementSectionDto } from '../interfaces/statement-section.interface';
import { CreateStatementMappingDto } from '../interfaces/mapping.interface';

@Injectable()
export class FinancialStatementMappingService {
  constructor(
    private readonly repository: FinancialStatementRepository,
    private readonly validator: FinancialStatementValidator,
    private readonly eventBus: DomainEventBusService
  ) {}

  async createStatement(storeId: number, name: string, type: string, description?: string) {
    return this.repository.createStatement({ store_id: storeId, name, type, description });
  }

  async createSection(storeId: number, dto: CreateStatementSectionDto) {
    // Basic validations
    const statement = await this.repository.getStatementByStoreAndId(storeId, dto.statement_id);
    if (!statement) throw new Error('Statement not found');

    return this.repository.createSection(dto);
  }

  async mapAccount(storeId: number, dto: CreateStatementMappingDto, userId: number) {
    await this.validator.validateMapping(storeId, dto.section_id, dto.account_id, dto.account_group_id);

    const mapping = await this.repository.createMapping(dto);

    this.eventBus.publish(new FinancialStatementMappingCreatedEvent(storeId, 0, userId, mapping.id.toString(), 'mapAccount', { mapping }));

    return mapping;
  }
}
