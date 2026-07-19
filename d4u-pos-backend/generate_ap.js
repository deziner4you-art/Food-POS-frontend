const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/vendor-payable-created.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class VendorPayableCreatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'VENDOR_PAYABLE_CREATED';
  occurred_at = new Date();
  entity_type = 'VENDOR_PAYABLE';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/vendor-payment-posted.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class VendorPaymentPostedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'VENDOR_PAYMENT_POSTED';
  occurred_at = new Date();
  entity_type = 'VENDOR_PAYMENT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/vendor-aging-calculated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class VendorAgingCalculatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'VENDOR_AGING_CALCULATED';
  occurred_at = new Date();
  entity_type = 'VENDOR_AGING';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/accounts-payable.interface.ts': `export interface CreatePayableInput {
  store_id: number;
  vendor_id: number;
  purchase_invoice_id: string;
  invoice_date: Date;
  due_date: Date;
  total_amount: number;
  accounts_payable_account_id: number;
  inventory_expense_account_id: number;
}
`,

  'interfaces/vendor-payment.interface.ts': `export interface CreateVendorPaymentInput {
  store_id: number;
  vendor_id: number;
  payable_id: number;
  amount: number;
  payment_method: string;
  reference_number?: string;
  cash_bank_account_id: number;
  accounts_payable_account_id: number;
}
`,

  'interfaces/vendor-aging.interface.ts': `export interface CalculateVendorAgingInput {
  store_id: number;
  vendor_id: number;
}
`,

  // Repository
  'repositories/accounts-payable.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class AccountsPayableRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPayable(data: any) {
    return this.prisma.vendorPayable.create({ data });
  }

  async getPayable(id: number) {
    return this.prisma.vendorPayable.findUnique({ where: { id } });
  }

  async getPayablesByVendor(storeId: number, vendorId: number) {
    return this.prisma.vendorPayable.findMany({
      where: { store_id: storeId, vendor_id: vendorId }
    });
  }

  async updatePayableBalance(id: number, paidAmount: number, outstandingBalance: number, status: string) {
    return this.prisma.vendorPayable.update({
      where: { id },
      data: {
        paid_amount: paidAmount,
        outstanding_balance: outstandingBalance,
        status
      }
    });
  }

  async createPayment(data: any) {
    return this.prisma.vendorPayment.create({ data });
  }

  async getOpenPayables(storeId: number, vendorId: number) {
    return this.prisma.vendorPayable.findMany({
      where: {
        store_id: storeId,
        vendor_id: vendorId,
        status: { in: ['OPEN', 'PARTIAL'] }
      }
    });
  }

  async upsertAging(storeId: number, vendorId: number, data: any) {
    return this.prisma.vendorAging.upsert({
      where: { store_id_vendor_id: { store_id: storeId, vendor_id: vendorId } },
      update: data,
      create: {
        store_id: storeId,
        vendor_id: vendorId,
        ...data
      }
    });
  }

  async getVendor(id: number) {
    return this.prisma.vendor.findUnique({ where: { id } });
  }
}
`,

  // Validator
  'validators/accounts-payable.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { AccountsPayableRepository } from '../repositories/accounts-payable.repository';
import { CreatePayableInput } from '../interfaces/accounts-payable.interface';
import { CreateVendorPaymentInput } from '../interfaces/vendor-payment.interface';

@Injectable()
export class AccountsPayableValidator {
  constructor(private readonly repository: AccountsPayableRepository) {}

  async validatePayable(input: CreatePayableInput) {
    if (!input.purchase_invoice_id) throw new BadRequestException('Purchase Invoice ID is required');
    if (input.total_amount <= 0) throw new BadRequestException('Amount must be > 0');

    const vendor = await this.repository.getVendor(input.vendor_id);
    if (!vendor) throw new BadRequestException('Invalid Vendor');
  }

  async validatePayment(input: CreateVendorPaymentInput) {
    if (input.amount <= 0) throw new BadRequestException('Payment amount must be > 0');
    
    const payable = await this.repository.getPayable(input.payable_id);
    if (!payable) throw new BadRequestException('Payable not found');
    if (payable.vendor_id !== input.vendor_id) throw new BadRequestException('Payable belongs to another vendor');
    
    if (Number(payable.outstanding_balance) < input.amount) {
      throw new BadRequestException('Payment amount cannot exceed outstanding balance');
    }
    
    return payable;
  }
}
`,

  // Services
  'services/accounts-payable.service.ts': `import { Injectable } from '@nestjs/common';
import { AccountsPayableRepository } from '../repositories/accounts-payable.repository';
import { AccountsPayableValidator } from '../validators/accounts-payable.validator';
import { JournalEntryService } from './journal-entry.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { CreatePayableInput } from '../interfaces/accounts-payable.interface';
import { VendorPayableCreatedEvent } from '../events/vendor-payable-created.event';

@Injectable()
export class AccountsPayableService {
  constructor(
    private readonly repository: AccountsPayableRepository,
    private readonly validator: AccountsPayableValidator,
    private readonly journalService: JournalEntryService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async createPayable(input: CreatePayableInput, userId: number) {
    await this.validator.validatePayable(input);

    const journalDto: any = {
      fiscal_year_id: 1, // Look up real FY based on invoice_date
      accounting_period_id: 1, // Look up real AP
      currency_id: 1,
      posting_date: new Date(input.invoice_date),
      reference_number: \`PINV-\${input.purchase_invoice_id}\`,
      description: \`Credit Purchase Invoice \${input.purchase_invoice_id}\`,
      lines: [
        {
          account_id: input.inventory_expense_account_id,
          debit_amount: input.total_amount,
          credit_amount: 0,
          description: 'Inventory / Expense'
        },
        {
          account_id: input.accounts_payable_account_id,
          debit_amount: 0,
          credit_amount: input.total_amount,
          description: 'Accounts Payable'
        }
      ]
    };

    const je = await this.journalService.create(input.store_id, journalDto);
    await this.journalService.submit(input.store_id, je.id);
    await this.journalService.approve(input.store_id, je.id);

    const payable = await this.repository.createPayable({
      store_id: input.store_id,
      vendor_id: input.vendor_id,
      purchase_invoice_id: input.purchase_invoice_id,
      invoice_date: new Date(input.invoice_date),
      due_date: new Date(input.due_date),
      total_amount: input.total_amount,
      outstanding_balance: input.total_amount,
      status: 'OPEN',
      journal_entry_id: je.id
    });

    this.eventBus.publish(new VendorPayableCreatedEvent(
      input.store_id, 0, userId, payable.id.toString(), 'payable_created', { purchase_invoice_id: input.purchase_invoice_id, amount: input.total_amount }
    ));

    return payable;
  }

  async getPayables(storeId: number) {
    return [];
  }

  async getVendorPayables(storeId: number, vendorId: number) {
    return this.repository.getPayablesByVendor(storeId, vendorId);
  }
}
`,

  'services/vendor-payment.service.ts': `import { Injectable } from '@nestjs/common';
import { AccountsPayableRepository } from '../repositories/accounts-payable.repository';
import { AccountsPayableValidator } from '../validators/accounts-payable.validator';
import { JournalEntryService } from './journal-entry.service';
import { VendorAgingService } from './vendor-aging.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { CreateVendorPaymentInput } from '../interfaces/vendor-payment.interface';
import { VendorPaymentPostedEvent } from '../events/vendor-payment-posted.event';
import { randomUUID } from 'crypto';

@Injectable()
export class VendorPaymentService {
  constructor(
    private readonly repository: AccountsPayableRepository,
    private readonly validator: AccountsPayableValidator,
    private readonly journalService: JournalEntryService,
    private readonly agingService: VendorAgingService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async postPayment(input: CreateVendorPaymentInput, userId: number) {
    const payable = await this.validator.validatePayment(input);

    const paymentNumber = \`PMT-\${randomUUID().substring(0, 8).toUpperCase()}\`;

    const journalDto: any = {
      fiscal_year_id: 1, // Look up real FY
      accounting_period_id: 1, // Look up real AP
      currency_id: 1,
      posting_date: new Date(),
      reference_number: paymentNumber,
      description: \`Payment \${paymentNumber} for Invoice \${payable.purchase_invoice_id}\`,
      lines: [
        {
          account_id: input.accounts_payable_account_id,
          debit_amount: input.amount,
          credit_amount: 0,
          description: 'Accounts Payable Debit'
        },
        {
          account_id: input.cash_bank_account_id,
          debit_amount: 0,
          credit_amount: input.amount,
          description: 'Cash / Bank Payment'
        }
      ]
    };

    const je = await this.journalService.create(input.store_id, journalDto);
    await this.journalService.submit(input.store_id, je.id);
    await this.journalService.approve(input.store_id, je.id);

    const payment = await this.repository.createPayment({
      store_id: input.store_id,
      payable_id: input.payable_id,
      payment_number: paymentNumber,
      amount: input.amount,
      payment_method: input.payment_method,
      reference_number: input.reference_number,
      journal_entry_id: je.id
    });

    const newPaidAmount = Number(payable.paid_amount) + input.amount;
    const newOutstanding = Number(payable.outstanding_balance) - input.amount;
    const newStatus = newOutstanding <= 0 ? 'CLOSED' : 'PARTIAL';

    await this.repository.updatePayableBalance(payable.id, newPaidAmount, newOutstanding, newStatus);

    await this.agingService.calculateAging({ store_id: input.store_id, vendor_id: input.vendor_id }, userId);

    this.eventBus.publish(new VendorPaymentPostedEvent(
      input.store_id, 0, userId, payment.id.toString(), 'payment_posted', { amount: input.amount, payment_number: paymentNumber }
    ));

    return payment;
  }
}
`,

  'services/vendor-aging.service.ts': `import { Injectable } from '@nestjs/common';
import { AccountsPayableRepository } from '../repositories/accounts-payable.repository';
import { CalculateVendorAgingInput } from '../interfaces/vendor-aging.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { VendorAgingCalculatedEvent } from '../events/vendor-aging-calculated.event';

@Injectable()
export class VendorAgingService {
  constructor(
    private readonly repository: AccountsPayableRepository,
    private readonly eventBus: DomainEventBusService
  ) {}

  async calculateAging(input: CalculateVendorAgingInput, userId: number) {
    const payables = await this.repository.getOpenPayables(input.store_id, input.vendor_id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let current = 0;
    let days_1_30 = 0;
    let days_31_60 = 0;
    let days_61_90 = 0;
    let days_91_120 = 0;
    let days_over_120 = 0;
    let total_outstanding = 0;

    for (const rec of payables) {
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

    const aging = await this.repository.upsertAging(input.store_id, input.vendor_id, {
      current,
      days_1_30,
      days_31_60,
      days_61_90,
      days_91_120,
      days_over_120,
      total_outstanding,
      calculated_at: new Date()
    });

    this.eventBus.publish(new VendorAgingCalculatedEvent(
      input.store_id, 0, userId, aging.id.toString(), 'aging_calculated', { vendor_id: input.vendor_id, total: total_outstanding }
    ));

    return aging;
  }
}
`,

  // Controllers
  'controllers/accounts-payable.controller.ts': `import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { AccountsPayableService } from '../services/accounts-payable.service';
import { VendorPaymentService } from '../services/vendor-payment.service';
import { VendorAgingService } from '../services/vendor-aging.service';

@Controller('accounting')
export class AccountsPayableController {
  constructor(
    private readonly payableService: AccountsPayableService,
    private readonly paymentService: VendorPaymentService,
    private readonly agingService: VendorAgingService
  ) {}

  @Post('accounts-payable')
  async createPayable(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.payableService.createPayable(body, userId);
  }

  @Post('vendor-payments')
  async createPayment(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.paymentService.postPayment(body, userId);
  }

  @Get('accounts-payable')
  async getPayables(@Req() req: any) {
    return this.payableService.getPayables(req.user?.store_id || 1);
  }

  @Get('accounts-payable/:vendorId')
  async getVendorPayables(@Param('vendorId') vendorId: string, @Req() req: any) {
    return this.payableService.getVendorPayables(req.user?.store_id || 1, Number(vendorId));
  }

  @Get('vendor-aging/:vendorId')
  async getVendorAging(@Param('vendorId') vendorId: string, @Req() req: any) {
    return this.agingService.calculateAging({ store_id: req.user?.store_id || 1, vendor_id: Number(vendorId) }, req.user?.id || 1);
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
