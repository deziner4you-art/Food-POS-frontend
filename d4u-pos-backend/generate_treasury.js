const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/bank-transfer-completed.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class BankTransferCompletedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'BANK_TRANSFER_COMPLETED';
  occurred_at = new Date();
  entity_type = 'BANK_TRANSFER';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/cash-position-updated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class CashPositionUpdatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'CASH_POSITION_UPDATED';
  occurred_at = new Date();
  entity_type = 'CASH_POSITION';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/cash-forecast-generated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class CashForecastGeneratedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'CASH_FORECAST_GENERATED';
  occurred_at = new Date();
  entity_type = 'CASH_FORECAST';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/treasury.interface.ts': `export interface CreateCashTransactionInput {
  store_id: number;
  bank_account_id: number;
  transaction_type: 'INFLOW' | 'OUTFLOW';
  amount: number;
  description: string;
  reference_type?: string;
  reference_id?: string;
  adjustment_account_id?: number; // Needed if creating journal entry manually for standalone cash adjustment
}
`,

  'interfaces/bank-transfer.interface.ts': `export interface BankTransferInput {
  store_id: number;
  source_account_id: number;
  destination_account_id: number;
  amount: number;
  description?: string;
}
`,

  'interfaces/cash-forecast.interface.ts': `export interface GenerateForecastInput {
  store_id: number;
  forecast_date: Date;
}
`,

  'interfaces/cash-position.interface.ts': `export interface CalculateCashPositionInput {
  store_id: number;
  bank_account_id: number;
}
`,

  // Repository
  'repositories/treasury.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class TreasuryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBankAccount(id: number) {
    return this.prisma.bankAccount.findUnique({ where: { id } });
  }

  async getBankAccounts(storeId: number) {
    return this.prisma.bankAccount.findMany({ where: { store_id: storeId } });
  }

  async updateBankAccountBalance(id: number, newBalance: number) {
    return this.prisma.bankAccount.update({
      where: { id },
      data: { current_balance: newBalance }
    });
  }

  async createCashTransaction(data: any) {
    return this.prisma.cashTransaction.create({ data });
  }

  async createBankTransfer(data: any) {
    return this.prisma.bankTransfer.create({ data });
  }

  async upsertCashPosition(storeId: number, bankAccountId: number, data: any) {
    // Note: Prisma does not support unique constraint on non-unique fields natively without composite unique. 
    // We'll just create a new position snapshot instead of upserting.
    return this.prisma.cashPosition.create({
      data: {
        store_id: storeId,
        bank_account_id: bankAccountId,
        ...data
      }
    });
  }

  async createCashForecast(data: any) {
    return this.prisma.cashForecast.create({ data });
  }
}
`,

  // Validator
  'validators/treasury.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { TreasuryRepository } from '../repositories/treasury.repository';
import { BankTransferInput } from '../interfaces/bank-transfer.interface';

@Injectable()
export class TreasuryValidator {
  constructor(private readonly repository: TreasuryRepository) {}

  async validateBankTransfer(input: BankTransferInput) {
    if (input.source_account_id === input.destination_account_id) {
      throw new BadRequestException('Source and destination accounts must be different');
    }
    if (input.amount <= 0) {
      throw new BadRequestException('Transfer amount must be greater than 0');
    }

    const source = await this.repository.getBankAccount(input.source_account_id);
    if (!source || !source.is_active) throw new BadRequestException('Invalid or inactive source account');

    const dest = await this.repository.getBankAccount(input.destination_account_id);
    if (!dest || !dest.is_active) throw new BadRequestException('Invalid or inactive destination account');

    if (Number(source.current_balance) < input.amount) {
      throw new BadRequestException('Insufficient funds in source account');
    }

    return { source, dest };
  }
}
`,

  // Services
  'services/treasury.service.ts': `import { Injectable } from '@nestjs/common';
import { TreasuryRepository } from '../repositories/treasury.repository';
import { JournalEntryService } from './journal-entry.service';
import { CashPositionService } from './cash-position.service';
import { CreateCashTransactionInput } from '../interfaces/treasury.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';

@Injectable()
export class TreasuryService {
  constructor(
    private readonly repository: TreasuryRepository,
    private readonly journalService: JournalEntryService,
    private readonly positionService: CashPositionService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async createCashAdjustment(input: CreateCashTransactionInput, userId: number) {
    const account = await this.repository.getBankAccount(input.bank_account_id);
    if (!account) throw new Error('Bank account not found');

    let jeId = null;
    if (input.adjustment_account_id) {
      const journalDto: any = {
        fiscal_year_id: 1, 
        accounting_period_id: 1,
        currency_id: 1,
        posting_date: new Date(),
        reference_number: \`CA-\${Date.now()}\`,
        description: input.description,
        lines: [
          {
            account_id: account.account_id,
            debit_amount: input.transaction_type === 'INFLOW' ? input.amount : 0,
            credit_amount: input.transaction_type === 'OUTFLOW' ? input.amount : 0,
            description: 'Bank Cash Adjustment'
          },
          {
            account_id: input.adjustment_account_id,
            debit_amount: input.transaction_type === 'OUTFLOW' ? input.amount : 0,
            credit_amount: input.transaction_type === 'INFLOW' ? input.amount : 0,
            description: 'Adjustment Offset'
          }
        ]
      };

      const je = await this.journalService.create(input.store_id, journalDto);
      await this.journalService.submit(input.store_id, je.id);
      await this.journalService.approve(input.store_id, je.id);
      jeId = je.id;
    }

    const newBalance = input.transaction_type === 'INFLOW' 
      ? Number(account.current_balance) + input.amount 
      : Number(account.current_balance) - input.amount;

    await this.repository.updateBankAccountBalance(account.id, newBalance);

    const txn = await this.repository.createCashTransaction({
      store_id: input.store_id,
      bank_account_id: input.bank_account_id,
      transaction_type: input.transaction_type,
      amount: input.amount,
      description: input.description,
      reference_type: input.reference_type,
      reference_id: input.reference_id,
      journal_entry_id: jeId
    });

    await this.positionService.updateCashPosition({ store_id: input.store_id, bank_account_id: input.bank_account_id }, userId);

    return txn;
  }

  async getBankAccounts(storeId: number) {
    return this.repository.getBankAccounts(storeId);
  }
}
`,

  'services/bank-transfer.service.ts': `import { Injectable } from '@nestjs/common';
import { TreasuryRepository } from '../repositories/treasury.repository';
import { TreasuryValidator } from '../validators/treasury.validator';
import { JournalEntryService } from './journal-entry.service';
import { CashPositionService } from './cash-position.service';
import { BankTransferInput } from '../interfaces/bank-transfer.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { BankTransferCompletedEvent } from '../events/bank-transfer-completed.event';
import { randomUUID } from 'crypto';

@Injectable()
export class BankTransferService {
  constructor(
    private readonly repository: TreasuryRepository,
    private readonly validator: TreasuryValidator,
    private readonly journalService: JournalEntryService,
    private readonly positionService: CashPositionService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async transfer(input: BankTransferInput, userId: number) {
    const { source, dest } = await this.validator.validateBankTransfer(input);

    const refNo = \`TRF-\${randomUUID().substring(0, 8).toUpperCase()}\`;

    const journalDto: any = {
      fiscal_year_id: 1, 
      accounting_period_id: 1,
      currency_id: 1,
      posting_date: new Date(),
      reference_number: refNo,
      description: input.description || \`Inter-bank transfer from \${source.bank_name} to \${dest.bank_name}\`,
      lines: [
        {
          account_id: dest.account_id,
          debit_amount: input.amount,
          credit_amount: 0,
          description: 'Transfer IN'
        },
        {
          account_id: source.account_id,
          debit_amount: 0,
          credit_amount: input.amount,
          description: 'Transfer OUT'
        }
      ]
    };

    const je = await this.journalService.create(input.store_id, journalDto);
    await this.journalService.submit(input.store_id, je.id);
    await this.journalService.approve(input.store_id, je.id);

    // Update source
    await this.repository.updateBankAccountBalance(source.id, Number(source.current_balance) - input.amount);
    await this.repository.createCashTransaction({
      store_id: input.store_id,
      bank_account_id: source.id,
      transaction_type: 'OUTFLOW',
      amount: input.amount,
      description: \`Transfer to \${dest.bank_name}\`,
      reference_type: 'TRANSFER',
      reference_id: refNo,
      journal_entry_id: je.id
    });

    // Update dest
    await this.repository.updateBankAccountBalance(dest.id, Number(dest.current_balance) + input.amount);
    await this.repository.createCashTransaction({
      store_id: input.store_id,
      bank_account_id: dest.id,
      transaction_type: 'INFLOW',
      amount: input.amount,
      description: \`Transfer from \${source.bank_name}\`,
      reference_type: 'TRANSFER',
      reference_id: refNo,
      journal_entry_id: je.id
    });

    const transfer = await this.repository.createBankTransfer({
      store_id: input.store_id,
      source_account_id: source.id,
      destination_account_id: dest.id,
      amount: input.amount,
      reference_number: refNo,
      description: input.description,
      journal_entry_id: je.id,
      created_by: userId
    });

    await this.positionService.updateCashPosition({ store_id: input.store_id, bank_account_id: source.id }, userId);
    await this.positionService.updateCashPosition({ store_id: input.store_id, bank_account_id: dest.id }, userId);

    this.eventBus.publish(new BankTransferCompletedEvent(
      input.store_id, 0, userId, transfer.id.toString(), 'transfer_completed', { amount: input.amount }
    ));

    return transfer;
  }
}
`,

  'services/cash-position.service.ts': `import { Injectable } from '@nestjs/common';
import { TreasuryRepository } from '../repositories/treasury.repository';
import { CalculateCashPositionInput } from '../interfaces/cash-position.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { CashPositionUpdatedEvent } from '../events/cash-position-updated.event';

@Injectable()
export class CashPositionService {
  constructor(
    private readonly repository: TreasuryRepository,
    private readonly eventBus: DomainEventBusService
  ) {}

  async updateCashPosition(input: CalculateCashPositionInput, userId: number) {
    const account = await this.repository.getBankAccount(input.bank_account_id);
    if (!account) return;

    // Ideally, we'd calculate net change since last snapshot. 
    // Here we just snap the current balance.
    const pos = await this.repository.upsertCashPosition(input.store_id, input.bank_account_id, {
      opening_balance: account.current_balance, // simplistic snapshot
      closing_balance: account.current_balance,
      net_change: 0
    });

    this.eventBus.publish(new CashPositionUpdatedEvent(
      input.store_id, 0, userId, pos.id.toString(), 'position_updated', { balance: account.current_balance }
    ));

    return pos;
  }
}
`,

  'services/cash-forecast.service.ts': `import { Injectable } from '@nestjs/common';
import { TreasuryRepository } from '../repositories/treasury.repository';
import { GenerateForecastInput } from '../interfaces/cash-forecast.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { CashForecastGeneratedEvent } from '../events/cash-forecast-generated.event';

@Injectable()
export class CashForecastService {
  constructor(
    private readonly repository: TreasuryRepository,
    private readonly eventBus: DomainEventBusService
  ) {}

  async generateForecast(input: GenerateForecastInput, userId: number) {
    // In a real system, we'd sum all open CustomerReceivables for inflows
    // and VendorPayables for outflows due within the forecast period.
    const expectedInflows = 50000; // Mock data
    const expectedOutflows = 30000; // Mock data
    const netForecast = expectedInflows - expectedOutflows;

    const forecast = await this.repository.createCashForecast({
      store_id: input.store_id,
      forecast_date: new Date(input.forecast_date),
      expected_inflows: expectedInflows,
      expected_outflows: expectedOutflows,
      net_forecast: netForecast
    });

    this.eventBus.publish(new CashForecastGeneratedEvent(
      input.store_id, 0, userId, forecast.id.toString(), 'forecast_generated', { net_forecast: netForecast }
    ));

    return forecast;
  }
}
`,

  // Controllers
  'controllers/treasury.controller.ts': `import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { TreasuryService } from '../services/treasury.service';
import { BankTransferService } from '../services/bank-transfer.service';
import { CashPositionService } from '../services/cash-position.service';
import { CashForecastService } from '../services/cash-forecast.service';

@Controller('accounting/treasury')
export class TreasuryController {
  constructor(
    private readonly treasuryService: TreasuryService,
    private readonly transferService: BankTransferService,
    private readonly positionService: CashPositionService,
    private readonly forecastService: CashForecastService
  ) {}

  @Post('bank-transfer')
  async createTransfer(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.transferService.transfer(body, userId);
  }

  @Post('cash-adjustment')
  async createAdjustment(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.treasuryService.createCashAdjustment(body, userId);
  }

  @Get('bank-accounts')
  async getBankAccounts(@Req() req: any) {
    return this.treasuryService.getBankAccounts(req.user?.store_id || 1);
  }

  @Get('cash-position/:accountId')
  async getCashPosition(@Param('accountId') accountId: string, @Req() req: any) {
    return this.positionService.updateCashPosition({ store_id: req.user?.store_id || 1, bank_account_id: Number(accountId) }, req.user?.id || 1);
  }

  @Post('cash-forecast')
  async generateForecast(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.forecastService.generateForecast(body, userId);
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
