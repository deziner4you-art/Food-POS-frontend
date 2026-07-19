import { Injectable, BadRequestException } from '@nestjs/common';
import { FinancialStatementRepository } from '../repositories/financial-statement.repository';
import { TrialBalanceService } from './trial-balance.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { FinancialStatementGeneratedEvent } from '../events/financial-statement-generated.event';
import { FinancialStatementResult, StatementSectionResult, StatementLineResult } from '../interfaces/financial-statement.interface';

@Injectable()
export class FinancialStatementBuilderService {
  constructor(
    private readonly repository: FinancialStatementRepository,
    private readonly tbService: TrialBalanceService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async buildStatement(storeId: number, statementId: number, startDate: Date, endDate: Date, fiscalYearId: number, userId: number): Promise<FinancialStatementResult> {
    const statement = await this.repository.getStatementStructure(statementId);
    if (!statement || statement.store_id !== storeId) {
      throw new BadRequestException('Financial statement not found.');
    }

    // Get trial balance to populate values
    const tb = await this.tbService.generateTrialBalance({
      fiscal_year_id: fiscalYearId,
      start_date: startDate,
      end_date: endDate,
      store_id: storeId
    }, userId);

    const result: FinancialStatementResult = {
      statement_id: statement.id,
      store_id: storeId,
      name: statement.name,
      type: statement.type,
      start_date: startDate,
      end_date: endDate,
      sections: []
    };

    // Helper map for fast lookup
    const tbMap = new Map();
    for (const line of tb.lines) {
      tbMap.set(line.account_id, line);
    }

    const accounts = await this.repository.getStoreAccounts(storeId);
    const groups = await this.repository.getStoreAccountGroups(storeId);

    const accountToGroupMap = new Map();
    for (const acc of accounts) {
      accountToGroupMap.set(acc.id, acc.account_group_id);
    }
    const groupNameMap = new Map();
    for (const g of groups) {
      groupNameMap.set(g.id, g.name);
    }

    const tbGroupMap = new Map();
    for (const line of tb.lines) {
      const gId = accountToGroupMap.get(line.account_id);
      if (gId) {
        if (!tbGroupMap.has(gId)) tbGroupMap.set(gId, []);
        tbGroupMap.get(gId).push(line);
      }
    }

    // Build hierarchical sections
    const buildSection = (section: any): StatementSectionResult => {
      let total = 0;
      const lines: StatementLineResult[] = [];

      for (const map of section.mappings) {
        if (!map.is_active) continue;

        if (map.account_id) {
          const tbLine: any = tbMap.get(map.account_id);
          if (tbLine) {
            const amount = Number(tbLine.net_balance || tbLine.closing_balance || 0);
            lines.push({ account_id: map.account_id, code: tbLine.account_code, name: tbLine.account_name, amount });
            total += amount;
          }
        } else if (map.account_group_id) {
          const tbLines = tbGroupMap.get(map.account_group_id) || [];
          let gTotal = 0;
          for (const tl of tbLines) {
             const tbLine: any = tl;
             gTotal += Number(tbLine.net_balance || tbLine.closing_balance || 0); // fallback to net_balance or closing_balance depending on what TrialBalance provides
          }
          if (tbLines.length > 0) {
             const groupName = groupNameMap.get(map.account_group_id) || `Group ${map.account_group_id}`;
             lines.push({ account_group_id: map.account_group_id, code: `GRP-${map.account_group_id}`, name: groupName, amount: gTotal });
             total += gTotal;
          }
        }
      }

      const subSections: StatementSectionResult[] = [];
      const children = statement.sections.filter(s => s.parent_section_id === section.id);
      for (const child of children) {
        const sub = buildSection(child);
        subSections.push(sub);
        total += sub.total_amount;
      }

      return {
        section_id: section.id,
        name: section.name,
        type: section.type,
        sort_order: section.sort_order,
        total_amount: total,
        sub_sections: subSections,
        lines
      };
    };

    // Root sections
    const rootSections = statement.sections.filter(s => !s.parent_section_id);
    for (const rs of rootSections) {
      result.sections.push(buildSection(rs));
    }

    this.eventBus.publish(new FinancialStatementGeneratedEvent(storeId, 0, userId, statement.id.toString(), 'build', { statementId }));

    return result;
  }
}
