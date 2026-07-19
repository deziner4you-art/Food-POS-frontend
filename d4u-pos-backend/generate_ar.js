const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/customer-receivable-created.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class CustomerReceivableCreatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'CUSTOMER_RECEIVABLE_CREATED';
  occurred_at = new Date();
  entity_type = 'CUSTOMER_RECEIVABLE';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/customer-receipt-posted.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class CustomerReceiptPostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'CUSTOMER_RECEIPT_POSTED';
  occurred_at = new Date();
  entity_type = 'CUSTOMER_RECEIPT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/customer-aging-calculated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class CustomerAgingCalculatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'CUSTOMER_AGING_CALCULATED';
  occurred_at = new Date();
  entity_type = 'CUSTOMER_AGING';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/accounts-receivable.interface.ts': `export interface CreateReceivableInput {
  store_id: number;
  customer_id: number;
  invoice_id: string;
  invoice_date: Date;
  due_date: Date;
  total_amount: number;
  accounts_receivable_account_id: number;
  sales_revenue_account_id: number;
}
`,

  'interfaces/customer-receipt.interface.ts': `export interface CreateReceiptInput {
  store_id: number;
  customer_id: number;
  receivable_id: number;
  amount: number;
  payment_method: string;
  reference_number?: string;
  cash_bank_account_id: number;
  accounts_receivable_account_id: number;
}
`,

  'interfaces/customer-aging.interface.ts': `export interface CalculateAgingInput {
  store_id: number;
  customer_id: number;
}
`,

  // Repository
  'repositories/accounts-receivable.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class AccountsReceivableRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createReceivable(data: any) {
    return this.prisma.customerReceivable.create({ data });
  }

  async getReceivable(id: number) {
    return this.prisma.customerReceivable.findUnique({ where: { id } });
  }

  async getReceivablesByCustomer(storeId: number, customerId: number) {
    return this.prisma.customerReceivable.findMany({
      where: { store_id: storeId, customer_id: customerId }
    });
  }

  async updateReceivableBalance(id: number, paidAmount: number, outstandingBalance: number, status: string) {
    return this.prisma.customerReceivable.update({
      where: { id },
      data: {
        paid_amount: paidAmount,
        outstanding_balance: outstandingBalance,
        status
      }
    });
  }

  async createReceipt(data: any) {
    return this.prisma.customerReceipt.create({ data });
  }

  async getOpenReceivables(storeId: number, customerId: number) {
    return this.prisma.customerReceivable.findMany({
      where: {
        store_id: storeId,
        customer_id: customerId,
        status: { in: ['OPEN', 'PARTIAL'] }
      }
    });
  }

  async upsertAging(storeId: number, customerId: number, data: any) {
    return this.prisma.customerAging.upsert({
      where: { store_id_customer_id: { store_id: storeId, customer_id: customerId } },
      update: data,
      create: {
        store_id: storeId,
        customer_id: customerId,
        ...data
      }
    });
  }

  async getCreditLimit(storeId: number, customerId: number) {
    return this.prisma.customerCreditLimit.findUnique({
      where: { store_id_customer_id: { store_id: storeId, customer_id: customerId } }
    });
  }

  async getCustomer(id: number) {
    return this.prisma.customer.findUnique({ where: { id } });
  }
}
`,

  // Validator
  'validators/accounts-receivable.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { AccountsReceivableRepository } from '../repositories/accounts-receivable.repository';
import { CreateReceivableInput } from '../interfaces/accounts-receivable.interface';
import { CreateReceiptInput } from '../interfaces/customer-receipt.interface';

@Injectable()
export class AccountsReceivableValidator {
  constructor(private readonly repository: AccountsReceivableRepository) {}

  async validateReceivable(input: CreateReceivableInput) {
    if (!input.invoice_id) throw new BadRequestException('Invoice ID is required');
    if (input.total_amount <= 0) throw new BadRequestException('Amount must be > 0');

    const customer = await this.repository.getCustomer(input.customer_id);
    if (!customer) throw new BadRequestException('Invalid Customer');

    const limit = await this.repository.getCreditLimit(input.store_id, input.customer_id);
    if (limit && limit.is_active && limit.available_credit < input.total_amount) {
      throw new BadRequestException('Credit limit exceeded');
    }
  }

  async validateReceipt(input: CreateReceiptInput) {
    if (input.amount <= 0) throw new BadRequestException('Receipt amount must be > 0');
    
    const receivable = await this.repository.getReceivable(input.receivable_id);
    if (!receivable) throw new BadRequestException('Receivable not found');
    if (receivable.customer_id !== input.customer_id) throw new BadRequestException('Receivable belongs to another customer');
    
    if (Number(receivable.outstanding_balance) < input.amount) {
      throw new BadRequestException('Receipt amount cannot exceed outstanding balance');
    }
    
    return receivable;
  }
}
`,

  // Services
  'services/accounts-receivable.service.ts': `import { Injectable } from '@nestjs/common';
import { AccountsReceivableRepository } from '../repositories/accounts-receivable.repository';
import { AccountsReceivableValidator } from '../validators/accounts-receivable.validator';
import { JournalEntryService } from './journal-entry.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { CreateReceivableInput } from '../interfaces/accounts-receivable.interface';
import { CustomerReceivableCreatedEvent } from '../events/customer-receivable-created.event';

@Injectable()
export class AccountsReceivableService {
  constructor(
    private readonly repository: AccountsReceivableRepository,
    private readonly validator: AccountsReceivableValidator,
    private readonly journalService: JournalEntryService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async createReceivable(input: CreateReceivableInput, userId: number) {
    await this.validator.validateReceivable(input);

    const journalDto: any = {
      fiscal_year_id: 1, // Look up real FY based on invoice_date
      accounting_period_id: 1, // Look up real AP
      currency_id: 1,
      posting_date: new Date(input.invoice_date),
      reference_number: \`INV-\${input.invoice_id}\`,
      description: \`Credit Sale Invoice \${input.invoice_id}\`,
      lines: [
        {
          account_id: input.accounts_receivable_account_id,
          debit_amount: input.total_amount,
          credit_amount: 0,
          description: 'Accounts Receivable'
        },
        {
          account_id: input.sales_revenue_account_id,
          debit_amount: 0,
          credit_amount: input.total_amount,
          description: 'Sales Revenue'
        }
      ]
    };

    const je = await this.journalService.create(input.store_id, journalDto);
    await this.journalService.submit(input.store_id, je.id);
    await this.journalService.approve(input.store_id, je.id);

    const receivable = await this.repository.createReceivable({
      store_id: input.store_id,
      customer_id: input.customer_id,
      invoice_id: input.invoice_id,
      invoice_date: new Date(input.invoice_date),
      due_date: new Date(input.due_date),
      total_amount: input.total_amount,
      outstanding_balance: input.total_amount,
      status: 'OPEN',
      journal_entry_id: je.id
    });

    this.eventBus.publish(new CustomerReceivableCreatedEvent(
      input.store_id, 0, userId, receivable.id.toString(), 'receivable_created', { invoice_id: input.invoice_id, amount: input.total_amount }
    ));

    return receivable;
  }

  async getReceivables(storeId: number) {
    // Basic getter, normally you'd implement pagination
    // returning empty or mock for blueprint
    return [];
  }

  async getCustomerReceivables(storeId: number, customerId: number) {
    return this.repository.getReceivablesByCustomer(storeId, customerId);
  }
}
`,

  'services/customer-receipt.service.ts': `import { Injectable } from '@nestjs/common';
import { AccountsReceivableRepository } from '../repositories/accounts-receivable.repository';
import { AccountsReceivableValidator } from '../validators/accounts-receivable.validator';
import { JournalEntryService } from './journal-entry.service';
import { CustomerAgingService } from './customer-aging.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { CreateReceiptInput } from '../interfaces/customer-receipt.interface';
import { CustomerReceiptPostedEvent } from '../events/customer-receipt-posted.event';
import { randomUUID } from 'crypto';

@Injectable()
export class CustomerReceiptService {
  constructor(
    private readonly repository: AccountsReceivableRepository,
    private readonly validator: AccountsReceivableValidator,
    private readonly journalService: JournalEntryService,
    private readonly agingService: CustomerAgingService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async postReceipt(input: CreateReceiptInput, userId: number) {
    const receivable = await this.validator.validateReceipt(input);

    const receiptNumber = \`RCT-\${randomUUID().substring(0, 8).toUpperCase()}\`;

    const journalDto: any = {
      fiscal_year_id: 1, // Look up real FY
      accounting_period_id: 1, // Look up real AP
      currency_id: 1,
      posting_date: new Date(),
      reference_number: receiptNumber,
      description: \`Receipt \${receiptNumber} for Invoice \${receivable.invoice_id}\`,
      lines: [
        {
          account_id: input.cash_bank_account_id,
          debit_amount: input.amount,
          credit_amount: 0,
          description: 'Cash / Bank Receipt'
        },
        {
          account_id: input.accounts_receivable_account_id,
          debit_amount: 0,
          credit_amount: input.amount,
          description: 'Accounts Receivable Credit'
        }
      ]
    };

    const je = await this.journalService.create(input.store_id, journalDto);
    await this.journalService.submit(input.store_id, je.id);
    await this.journalService.approve(input.store_id, je.id);

    const receipt = await this.repository.createReceipt({
      store_id: input.store_id,
      receivable_id: input.receivable_id,
      receipt_number: receiptNumber,
      amount: input.amount,
      payment_method: input.payment_method,
      reference_number: input.reference_number,
      journal_entry_id: je.id
    });

    const newPaidAmount = Number(receivable.paid_amount) + input.amount;
    const newOutstanding = Number(receivable.outstanding_balance) - input.amount;
    const newStatus = newOutstanding <= 0 ? 'CLOSED' : 'PARTIAL';

    await this.repository.updateReceivableBalance(receivable.id, newPaidAmount, newOutstanding, newStatus);

    await this.agingService.calculateAging({ store_id: input.store_id, customer_id: input.customer_id }, userId);

    this.eventBus.publish(new CustomerReceiptPostedEvent(
      input.store_id, 0, userId, receipt.id.toString(), 'receipt_posted', { amount: input.amount, receipt_number: receiptNumber }
    ));

    return receipt;
  }
}
`,

  'services/customer-aging.service.ts': `import { Injectable } from '@nestjs/common';
import { AccountsReceivableRepository } from '../repositories/accounts-receivable.repository';
import { CalculateAgingInput } from '../interfaces/customer-aging.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { CustomerAgingCalculatedEvent } from '../events/customer-aging-calculated.event';

@Injectable()
export class CustomerAgingService {
  constructor(
    private readonly repository: AccountsReceivableRepository,
    private readonly eventBus: DomainEventBusService
  ) {}

  async calculateAging(input: CalculateAgingInput, userId: number) {
    const receivables = await this.repository.getOpenReceivables(input.store_id, input.customer_id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let current = 0;
    let days_1_30 = 0;
    let days_31_60 = 0;
    let days_61_90 = 0;
    let days_91_120 = 0;
    let days_over_120 = 0;
    let total_outstanding = 0;

    for (const rec of receivables) {
      const balance = Number(rec.outstanding_balance);
      total_outstanding += balance;

      const dueDate = new Date(rec.due_date);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        current += balance;
      } else if (diffDays <= 30) {
        days_1_30 += balance;
      } else if (diffDays <= 60) {
        days_31_60 += balance;
      } else if (diffDays <= 90) {
        days_61_90 += balance;
      } else if (diffDays <= 120) {
        days_91_120 += balance;
      } else {
        days_over_120 += balance;
      }
    }

    const aging = await this.repository.upsertAging(input.store_id, input.customer_id, {
      current,
      days_1_30,
      days_31_60,
      days_61_90,
      days_91_120,
      days_over_120,
      total_outstanding,
      calculated_at: new Date()
    });

    this.eventBus.publish(new CustomerAgingCalculatedEvent(
      input.store_id, 0, userId, aging.id.toString(), 'aging_calculated', { customer_id: input.customer_id, total: total_outstanding }
    ));

    return aging;
  }
}
`,

  // Controllers
  'controllers/accounts-receivable.controller.ts': `import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { AccountsReceivableService } from '../services/accounts-receivable.service';
import { CustomerReceiptService } from '../services/customer-receipt.service';
import { CustomerAgingService } from '../services/customer-aging.service';

@Controller('accounting')
export class AccountsReceivableController {
  constructor(
    private readonly receivableService: AccountsReceivableService,
    private readonly receiptService: CustomerReceiptService,
    private readonly agingService: CustomerAgingService
  ) {}

  @Post('accounts-receivable')
  async createReceivable(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.receivableService.createReceivable(body, userId);
  }

  @Post('customer-receipts')
  async createReceipt(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.receiptService.postReceipt(body, userId);
  }

  @Get('accounts-receivable')
  async getReceivables(@Req() req: any) {
    return this.receivableService.getReceivables(req.user?.store_id || 1);
  }

  @Get('accounts-receivable/:customerId')
  async getCustomerReceivables(@Param('customerId') customerId: string, @Req() req: any) {
    return this.receivableService.getCustomerReceivables(req.user?.store_id || 1, Number(customerId));
  }

  @Get('customer-aging/:customerId')
  async getCustomerAging(@Param('customerId') customerId: string, @Req() req: any) {
    return this.agingService.calculateAging({ store_id: req.user?.store_id || 1, customer_id: Number(customerId) }, req.user?.id || 1);
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
