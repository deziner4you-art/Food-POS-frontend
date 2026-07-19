import { Injectable, BadRequestException } from '@nestjs/common';
import { FinancialStatementRepository } from '../repositories/financial-statement.repository';
import { TrialBalanceService } from './trial-balance.service';
import { FinancialStatementResult, StatementSectionResult, StatementLineResult } from '../interfaces/financial-statement.interface';

@Injectable()
export class CashFlowBuilderService {
  constructor(
    private readonly repository: FinancialStatementRepository,
    private readonly tbService: TrialBalanceService
  ) {}

  async buildStatement(storeId: number, statementId: number, startDate: Date, endDate: Date, fiscalYearId: number, userId: number): Promise<FinancialStatementResult> {
    const statement = await this.repository.getStatementStructure(statementId);
    if (!statement || statement.store_id !== storeId) {
      throw new BadRequestException('Cash Flow statement not found.');
    }

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

    const buildSection = (section: any): StatementSectionResult => {
      let total = 0;
      const lines: StatementLineResult[] = [];

      for (const map of section.mappings) {
        if (!map.is_active) continue;

        if (map.account_id) {
          const tbLine: any = tbMap.get(map.account_id);
          if (tbLine) {
            // For Cash Flow, we use the net period movement (period_debit - period_credit or similar)
            // Or we just use what TrialBalance provides. Usually cash flow mappings map to period movements.
            const amount = Number(tbLine.period_credit || 0) - Number(tbLine.period_debit || 0); // Placeholder logic for CF
            lines.push({ account_id: map.account_id, code: tbLine.account_code, name: tbLine.account_name, amount });
            total += amount;
          }
        } else if (map.account_group_id) {
          const tbLines = tbGroupMap.get(map.account_group_id) || [];
          let gTotal = 0;
          for (const tl of tbLines) {
             const tbLine: any = tl;
             gTotal += (Number(tbLine.period_credit || 0) - Number(tbLine.period_debit || 0));
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

    const rootSections = statement.sections.filter(s => !s.parent_section_id);
    for (const rs of rootSections) {
      result.sections.push(buildSection(rs));
    }

    return result;
  }
}
