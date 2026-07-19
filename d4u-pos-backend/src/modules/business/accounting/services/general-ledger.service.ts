import { Injectable, BadRequestException } from '@nestjs/common';
import { GeneralLedgerRepository } from '../repositories/general-ledger.repository';
import { LedgerQueryDto } from '../dto/ledger-query.dto';

@Injectable()
export class GeneralLedgerService {
  constructor(private readonly repo: GeneralLedgerRepository) {}

  // Normally called by the Posting Engine (Internal Event)
  async postLedgerEntries(storeId: number, entries: any[]) {
    // Ensure no duplicate journal_entry_line_id
    // This is handled by DB unique constraint on journal_entry_line_id
    
    // Sort chronologically
    entries.sort((a, b) => new Date(a.posting_date).getTime() - new Date(b.posting_date).getTime());

    const recordsToInsert = [];
    
    // Process running balance
    // Note: In highly concurrent systems, this requires row locking on the Account.
    // For MVP we do it sequentially.
    for (const entry of entries) {
      const latest = await this.repo.getLatestEntryForAccount(storeId, entry.account_id);
      
      let currentBalance = latest ? Number(latest.running_balance) : 0;
      const debit = Number(entry.debit) || 0;
      const credit = Number(entry.credit) || 0;

      // Assuming standard mathematical balance: Balance + Debit - Credit 
      // (Depends on account type normal balance, but usually strict mathematical is easier 
      // and normal balance rules are applied on UI)
      currentBalance = currentBalance + debit - credit;

      recordsToInsert.push({
        ...entry,
        running_balance: currentBalance,
      });
    }

    try {
      await this.repo.createMany(storeId, recordsToInsert);
    } catch (e) {
      if (e.code === 'P2002') {
        throw new BadRequestException('Duplicate ledger posting rejected.');
      }
      throw e;
    }
  }

  async queryLedger(storeId: number, query: LedgerQueryDto) {
    return this.repo.findByQuery(storeId, query);
  }

  async getAccountBalance(storeId: number, accountId: number) {
    const latest = await this.repo.getLatestEntryForAccount(storeId, accountId);
    
    return {
      account_id: accountId,
      closing_balance: latest ? Number(latest.running_balance) : 0,
      as_of: latest ? latest.posting_date : null,
    };
  }

  async getTrialBalanceData(storeId: number, query: LedgerQueryDto) {
    // This aggregates debit and credit. For MVP, we fetch ledger and aggregate.
    const ledger = await this.repo.findByQuery(storeId, query);
    
    const balanceMap = new Map();
    for (const entry of ledger) {
      const id = entry.account_id;
      if (!balanceMap.has(id)) {
        balanceMap.set(id, { debit_total: 0, credit_total: 0, account: entry.account });
      }
      const data = balanceMap.get(id);
      data.debit_total += Number(entry.debit);
      data.credit_total += Number(entry.credit);
    }
    
    return Array.from(balanceMap.values());
  }
}
