const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Interfaces
  'interfaces/accounting-request.interface.ts': `export interface AccountingRequest {
  tenant_id: number;
  store_id: number;
  business_module: string;
  business_event: string;
  business_document_id: string;
  document_number: string;
  transaction_date: Date;
  currency_id?: number;
  user_id: number;
  reference: string;
  amount: number;
  tax_amount?: number;
  metadata?: Record<string, any>;
}
`,

  'interfaces/accounting-response.interface.ts': `export interface AccountingResponse {
  success: boolean;
  voucher_id?: number;
  journal_entry_id?: number;
  posting_status: string;
  ledger_status: string;
  reference_number: string;
  errors?: string[];
  warnings?: string[];
}
`,

  'interfaces/accounting-integration.interface.ts': `import { AccountingRequest } from './accounting-request.interface';
import { AccountingResponse } from './accounting-response.interface';

export interface IAccountingIntegration {
  processBusinessEvent(request: AccountingRequest): Promise<AccountingResponse>;
}
`,

  // Factories
  'factories/accounting-request.factory.ts': `import { Injectable } from '@nestjs/common';
import { AccountingRequest } from '../interfaces/accounting-request.interface';

@Injectable()
export class AccountingRequestFactory {
  createPosSaleRequest(storeId: number, orderId: string, amount: number, userId: number): AccountingRequest {
    return {
      tenant_id: 0, // Resolved from context normally
      store_id: storeId,
      business_module: 'POS',
      business_event: 'POS_SALE',
      business_document_id: orderId,
      document_number: \`ORD-\${orderId}\`,
      transaction_date: new Date(),
      user_id: userId,
      reference: \`POS Sale Order \${orderId}\`,
      amount,
    };
  }

  // Other factories can be added here
}
`,

  // Validators
  'validators/accounting-integration.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { AccountingRequest } from '../interfaces/accounting-request.interface';
import { AccountingPeriodStatus } from '../enums/accounting-period-status.enum';

@Injectable()
export class AccountingIntegrationValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateRequest(req: AccountingRequest) {
    if (!req.store_id || !req.business_event || req.amount === undefined || req.amount === null) {
      throw new BadRequestException('Invalid request payload. Missing core fields.');
    }

    const store = await this.prisma.store.findUnique({ where: { id: req.store_id } });
    if (!store) {
      throw new BadRequestException('Inactive or invalid store.');
    }

    const today = new Date();
    
    // Find active fiscal year
    const fy = await this.prisma.fiscalYear.findFirst({
      where: { 
        store_id: req.store_id, 
        is_active: true, 
        is_closed: false,
        start_date: { lte: today },
        end_date: { gte: today },
      }
    });

    if (!fy) {
      throw new BadRequestException('Active Fiscal Year not found for the transaction date.');
    }

    // Find open accounting period
    const period = await this.prisma.accountingPeriod.findFirst({
      where: {
        store_id: req.store_id,
        fiscal_year_id: fy.id,
        status: AccountingPeriodStatus.OPEN,
        start_date: { lte: today },
        end_date: { gte: today },
      }
    });

    if (!period) {
      throw new BadRequestException('OPEN Accounting Period not found for the transaction date.');
    }

    return { fy, period };
  }
}
`,

  // Services
  'services/accounting-integration.service.ts': `import { Injectable, Logger } from '@nestjs/common';
import { IAccountingIntegration } from '../interfaces/accounting-integration.interface';
import { AccountingRequest } from '../interfaces/accounting-request.interface';
import { AccountingResponse } from '../interfaces/accounting-response.interface';
import { AccountingIntegrationValidator } from '../validators/accounting-integration.validator';
import { AccountingRulesService } from './accounting-rules.service';
import { VoucherService } from './voucher.service';
import { JournalEntryService } from './journal-entry.service';
import { PostingEngineService } from './posting-engine.service';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class AccountingIntegrationService implements IAccountingIntegration {
  private readonly logger = new Logger(AccountingIntegrationService.name);

  constructor(
    private readonly validator: AccountingIntegrationValidator,
    private readonly rulesEngine: AccountingRulesService,
    private readonly voucherService: VoucherService,
    private readonly journalEntryService: JournalEntryService,
    private readonly postingEngine: PostingEngineService,
    private readonly prisma: PrismaService,
  ) {}

  async processBusinessEvent(request: AccountingRequest): Promise<AccountingResponse> {
    this.logger.log(\`Processing Business Event: \${request.business_event} for Store \${request.store_id}\`);

    try {
      // 1. Validate
      const { fy, period } = await this.validator.validateRequest(request);

      // 2. Resolve Accounting Rules
      const resolution = await this.rulesEngine.resolveAccountsForEvent({
        store_id: request.store_id,
        tenant_id: request.tenant_id,
        event_type: request.business_event,
        amount: request.amount,
        currency_id: request.currency_id,
      });

      // Provide defaults for Journal and VoucherType if missing
      const journal = await this.prisma.journal.findFirst({
        where: { store_id: request.store_id, is_active: true }
      });
      if (!journal) throw new Error('No active Journal configured for integration.');

      const voucherType = await this.prisma.voucherType.findFirst({
        where: { store_id: request.store_id }
      });
      if (!voucherType) throw new Error('No VoucherType configured for integration.');

      // 3. Create Voucher (Draft)
      const voucher = await this.voucherService.createVoucher(request.store_id, request.user_id, {
        voucher_type_id: voucherType.id,
        fiscal_year_id: fy.id,
        accounting_period_id: period.id,
        journal_id: journal.id,
        currency_id: request.currency_id || journal.default_currency_id,
        voucher_number: \`VOU-\${request.document_number}-\${Date.now()}\`,
        reference_number: request.reference,
        date: request.transaction_date.toISOString(),
        amount: request.amount,
        description: \`System Generated: \${request.business_event} \${request.document_number}\`,
      });

      // 4. Approve Voucher
      await this.voucherService.submitVoucher(request.store_id, voucher.id, request.user_id);
      await this.voucherService.approveVoucher(request.store_id, voucher.id, request.user_id);

      // 5. Create Journal Entry
      const je = await this.journalEntryService.createManualEntry(request.store_id, request.user_id, {
        journal_id: journal.id,
        fiscal_year_id: fy.id,
        accounting_period_id: period.id,
        posting_date: request.transaction_date.toISOString(),
        reference_number: \`JE-\${request.document_number}-\${Date.now()}\`,
        description: \`System Generated: \${request.business_event} \${request.document_number}\`,
        currency_id: request.currency_id || journal.default_currency_id,
        lines: [
          {
            account_id: resolution.debit_account_id,
            debit_amount: request.amount,
            credit_amount: 0,
            description: \`Debit line for \${request.business_event}\`,
          },
          {
            account_id: resolution.credit_account_id,
            debit_amount: 0,
            credit_amount: request.amount,
            description: \`Credit line for \${request.business_event}\`,
          }
        ]
      });

      // Map JE to Voucher (Since we don't have a direct method in VoucherService to attach JE, we update directly or just rely on Posting Engine)
      await this.prisma.voucher.update({
        where: { id: voucher.id },
        data: { journal_entry_id: je.id }
      });

      // Submit and Approve JE
      await this.journalEntryService.submitEntry(request.store_id, je.id, request.user_id);
      await this.journalEntryService.approveEntry(request.store_id, je.id, request.user_id);

      // 6. Post to General Ledger (Posting Engine)
      const postResult = await this.postingEngine.postManualEntry(request.store_id, je.id);

      return {
        success: true,
        voucher_id: voucher.id,
        journal_entry_id: je.id,
        posting_status: 'POSTED',
        ledger_status: postResult.success ? 'COMPLETED' : 'FAILED',
        reference_number: request.document_number,
        warnings: postResult.success ? [] : [postResult.message],
      };

    } catch (e) {
      this.logger.error(\`Integration Failed: \${e instanceof Error ? e.message : e}\`);
      return {
        success: false,
        posting_status: 'FAILED',
        ledger_status: 'FAILED',
        reference_number: request.document_number,
        errors: [e instanceof Error ? e.message : 'Unknown error'],
      };
    }
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
