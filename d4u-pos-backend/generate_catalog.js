const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Enums
  'enums/business-module.enum.ts': `export enum BusinessModule {
  POS = 'POS',
  INVENTORY = 'INVENTORY',
  PURCHASING = 'PURCHASING',
  SALES = 'SALES',
  CRM = 'CRM',
  PAYROLL = 'PAYROLL',
  HR = 'HR',
  SUBSCRIPTION = 'SUBSCRIPTION',
  BILLING = 'BILLING',
  ASSETS = 'ASSETS',
  MANUFACTURING = 'MANUFACTURING',
  RESTAURANT = 'RESTAURANT',
  ACCOUNTING = 'ACCOUNTING',
}
`,

  'enums/business-event.enum.ts': `export enum BusinessEvent {
  POS_SALE = 'POS_SALE',
  POS_REFUND = 'POS_REFUND',
  POS_VOID = 'POS_VOID',
  PURCHASE_INVOICE = 'PURCHASE_INVOICE',
  PURCHASE_RETURN = 'PURCHASE_RETURN',
  GOODS_RECEIPT = 'GOODS_RECEIPT',
  INVENTORY_ADJUSTMENT = 'INVENTORY_ADJUSTMENT',
  INVENTORY_CONSUMPTION = 'INVENTORY_CONSUMPTION',
  INVENTORY_TRANSFER = 'INVENTORY_TRANSFER',
  PAYROLL_APPROVED = 'PAYROLL_APPROVED',
  SALARY_PAID = 'SALARY_PAID',
  CUSTOMER_PAYMENT = 'CUSTOMER_PAYMENT',
  VENDOR_PAYMENT = 'VENDOR_PAYMENT',
  BANK_DEPOSIT = 'BANK_DEPOSIT',
  BANK_WITHDRAWAL = 'BANK_WITHDRAWAL',
  SUBSCRIPTION_ACTIVATED = 'SUBSCRIPTION_ACTIVATED',
  SUBSCRIPTION_RENEWED = 'SUBSCRIPTION_RENEWED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  ASSET_PURCHASE = 'ASSET_PURCHASE',
  ASSET_DISPOSAL = 'ASSET_DISPOSAL',
  MANUAL_JOURNAL = 'MANUAL_JOURNAL',
}
`,

  // Contracts
  'contracts/business-event.contract.ts': `import { BusinessModule } from '../enums/business-module.enum';
import { BusinessEvent } from '../enums/business-event.enum';

export interface BusinessEventContract {
  module: BusinessModule;
  event: BusinessEvent;
  document_type: string;
  document_id_prefix: string;
  posting_required: boolean;
  approval_required: boolean;
  default_currency: string;
  default_journal_code: string;
  accounting_rule_code: string;
  is_active: boolean;
}
`,

  'contracts/accounting-event.contract.ts': `import { BusinessEvent } from '../enums/business-event.enum';

export interface AccountingEventContract {
  event: BusinessEvent;
  voucher_type_code: string;
  journal_type_code: string;
  required_system_accounts: string[];
  auto_posting: boolean;
  approval_workflow_code: string;
}
`,

  // Catalogs
  'catalog/business-event-catalog.ts': `import { BusinessModule } from '../enums/business-module.enum';
import { BusinessEvent } from '../enums/business-event.enum';
import { BusinessEventContract } from '../contracts/business-event.contract';

export const BUSINESS_EVENT_CATALOG: Record<BusinessEvent, BusinessEventContract> = {
  [BusinessEvent.POS_SALE]: {
    module: BusinessModule.POS,
    event: BusinessEvent.POS_SALE,
    document_type: 'Order',
    document_id_prefix: 'ORD',
    posting_required: true,
    approval_required: false,
    default_currency: 'PKR',
    default_journal_code: 'SALES_JNL',
    accounting_rule_code: 'RULE_POS_SALE',
    is_active: true,
  },
  [BusinessEvent.POS_REFUND]: {
    module: BusinessModule.POS,
    event: BusinessEvent.POS_REFUND,
    document_type: 'Order',
    document_id_prefix: 'RFD',
    posting_required: true,
    approval_required: true,
    default_currency: 'PKR',
    default_journal_code: 'SALES_JNL',
    accounting_rule_code: 'RULE_POS_REFUND',
    is_active: true,
  },
  [BusinessEvent.POS_VOID]: {
    module: BusinessModule.POS,
    event: BusinessEvent.POS_VOID,
    document_type: 'Order',
    document_id_prefix: 'VOID',
    posting_required: true,
    approval_required: true,
    default_currency: 'PKR',
    default_journal_code: 'SALES_JNL',
    accounting_rule_code: 'RULE_POS_VOID',
    is_active: true,
  },
  [BusinessEvent.PURCHASE_INVOICE]: {
    module: BusinessModule.PURCHASING,
    event: BusinessEvent.PURCHASE_INVOICE,
    document_type: 'Invoice',
    document_id_prefix: 'PINV',
    posting_required: true,
    approval_required: true,
    default_currency: 'PKR',
    default_journal_code: 'PURCHASE_JNL',
    accounting_rule_code: 'RULE_PURCHASE_INVOICE',
    is_active: true,
  },
  [BusinessEvent.PURCHASE_RETURN]: {
    module: BusinessModule.PURCHASING,
    event: BusinessEvent.PURCHASE_RETURN,
    document_type: 'Return',
    document_id_prefix: 'PRET',
    posting_required: true,
    approval_required: true,
    default_currency: 'PKR',
    default_journal_code: 'PURCHASE_JNL',
    accounting_rule_code: 'RULE_PURCHASE_RETURN',
    is_active: true,
  },
  [BusinessEvent.GOODS_RECEIPT]: {
    module: BusinessModule.INVENTORY,
    event: BusinessEvent.GOODS_RECEIPT,
    document_type: 'Receipt',
    document_id_prefix: 'GRN',
    posting_required: true,
    approval_required: false,
    default_currency: 'PKR',
    default_journal_code: 'INVENTORY_JNL',
    accounting_rule_code: 'RULE_GOODS_RECEIPT',
    is_active: true,
  },
  [BusinessEvent.INVENTORY_ADJUSTMENT]: {
    module: BusinessModule.INVENTORY,
    event: BusinessEvent.INVENTORY_ADJUSTMENT,
    document_type: 'Adjustment',
    document_id_prefix: 'IADJ',
    posting_required: true,
    approval_required: true,
    default_currency: 'PKR',
    default_journal_code: 'INVENTORY_JNL',
    accounting_rule_code: 'RULE_INVENTORY_ADJUSTMENT',
    is_active: true,
  },
  [BusinessEvent.INVENTORY_CONSUMPTION]: {
    module: BusinessModule.INVENTORY,
    event: BusinessEvent.INVENTORY_CONSUMPTION,
    document_type: 'Consumption',
    document_id_prefix: 'ICNS',
    posting_required: true,
    approval_required: false,
    default_currency: 'PKR',
    default_journal_code: 'INVENTORY_JNL',
    accounting_rule_code: 'RULE_INVENTORY_CONSUMPTION',
    is_active: true,
  },
  [BusinessEvent.INVENTORY_TRANSFER]: {
    module: BusinessModule.INVENTORY,
    event: BusinessEvent.INVENTORY_TRANSFER,
    document_type: 'Transfer',
    document_id_prefix: 'ITRN',
    posting_required: true,
    approval_required: true,
    default_currency: 'PKR',
    default_journal_code: 'INVENTORY_JNL',
    accounting_rule_code: 'RULE_INVENTORY_TRANSFER',
    is_active: true,
  },
  [BusinessEvent.PAYROLL_APPROVED]: {
    module: BusinessModule.PAYROLL,
    event: BusinessEvent.PAYROLL_APPROVED,
    document_type: 'Payroll',
    document_id_prefix: 'PRL',
    posting_required: true,
    approval_required: true,
    default_currency: 'PKR',
    default_journal_code: 'PAYROLL_JNL',
    accounting_rule_code: 'RULE_PAYROLL_APPROVED',
    is_active: true,
  },
  [BusinessEvent.SALARY_PAID]: {
    module: BusinessModule.PAYROLL,
    event: BusinessEvent.SALARY_PAID,
    document_type: 'Payment',
    document_id_prefix: 'PAY',
    posting_required: true,
    approval_required: true,
    default_currency: 'PKR',
    default_journal_code: 'CASH_PAYMENT_JNL',
    accounting_rule_code: 'RULE_SALARY_PAID',
    is_active: true,
  },
  [BusinessEvent.CUSTOMER_PAYMENT]: {
    module: BusinessModule.SALES,
    event: BusinessEvent.CUSTOMER_PAYMENT,
    document_type: 'Receipt',
    document_id_prefix: 'RCP',
    posting_required: true,
    approval_required: false,
    default_currency: 'PKR',
    default_journal_code: 'CASH_RECEIPT_JNL',
    accounting_rule_code: 'RULE_CUSTOMER_PAYMENT',
    is_active: true,
  },
  [BusinessEvent.VENDOR_PAYMENT]: {
    module: BusinessModule.PURCHASING,
    event: BusinessEvent.VENDOR_PAYMENT,
    document_type: 'Payment',
    document_id_prefix: 'VPAY',
    posting_required: true,
    approval_required: true,
    default_currency: 'PKR',
    default_journal_code: 'CASH_PAYMENT_JNL',
    accounting_rule_code: 'RULE_VENDOR_PAYMENT',
    is_active: true,
  },
  [BusinessEvent.BANK_DEPOSIT]: {
    module: BusinessModule.ACCOUNTING,
    event: BusinessEvent.BANK_DEPOSIT,
    document_type: 'Deposit',
    document_id_prefix: 'BDEP',
    posting_required: true,
    approval_required: false,
    default_currency: 'PKR',
    default_journal_code: 'BANK_JNL',
    accounting_rule_code: 'RULE_BANK_DEPOSIT',
    is_active: true,
  },
  [BusinessEvent.BANK_WITHDRAWAL]: {
    module: BusinessModule.ACCOUNTING,
    event: BusinessEvent.BANK_WITHDRAWAL,
    document_type: 'Withdrawal',
    document_id_prefix: 'BWTH',
    posting_required: true,
    approval_required: true,
    default_currency: 'PKR',
    default_journal_code: 'BANK_JNL',
    accounting_rule_code: 'RULE_BANK_WITHDRAWAL',
    is_active: true,
  },
  [BusinessEvent.SUBSCRIPTION_ACTIVATED]: {
    module: BusinessModule.SUBSCRIPTION,
    event: BusinessEvent.SUBSCRIPTION_ACTIVATED,
    document_type: 'Subscription',
    document_id_prefix: 'SUB',
    posting_required: true,
    approval_required: false,
    default_currency: 'PKR',
    default_journal_code: 'SALES_JNL',
    accounting_rule_code: 'RULE_SUB_ACTIVATED',
    is_active: true,
  },
  [BusinessEvent.SUBSCRIPTION_RENEWED]: {
    module: BusinessModule.SUBSCRIPTION,
    event: BusinessEvent.SUBSCRIPTION_RENEWED,
    document_type: 'Subscription',
    document_id_prefix: 'SREN',
    posting_required: true,
    approval_required: false,
    default_currency: 'PKR',
    default_journal_code: 'SALES_JNL',
    accounting_rule_code: 'RULE_SUB_RENEWED',
    is_active: true,
  },
  [BusinessEvent.SUBSCRIPTION_CANCELLED]: {
    module: BusinessModule.SUBSCRIPTION,
    event: BusinessEvent.SUBSCRIPTION_CANCELLED,
    document_type: 'Subscription',
    document_id_prefix: 'SCAN',
    posting_required: true,
    approval_required: false,
    default_currency: 'PKR',
    default_journal_code: 'SALES_JNL',
    accounting_rule_code: 'RULE_SUB_CANCELLED',
    is_active: true,
  },
  [BusinessEvent.ASSET_PURCHASE]: {
    module: BusinessModule.ASSETS,
    event: BusinessEvent.ASSET_PURCHASE,
    document_type: 'Asset',
    document_id_prefix: 'AST',
    posting_required: true,
    approval_required: true,
    default_currency: 'PKR',
    default_journal_code: 'GENERAL_JNL',
    accounting_rule_code: 'RULE_ASSET_PURCHASE',
    is_active: true,
  },
  [BusinessEvent.ASSET_DISPOSAL]: {
    module: BusinessModule.ASSETS,
    event: BusinessEvent.ASSET_DISPOSAL,
    document_type: 'Asset',
    document_id_prefix: 'ADSP',
    posting_required: true,
    approval_required: true,
    default_currency: 'PKR',
    default_journal_code: 'GENERAL_JNL',
    accounting_rule_code: 'RULE_ASSET_DISPOSAL',
    is_active: true,
  },
  [BusinessEvent.MANUAL_JOURNAL]: {
    module: BusinessModule.ACCOUNTING,
    event: BusinessEvent.MANUAL_JOURNAL,
    document_type: 'Journal',
    document_id_prefix: 'MJ',
    posting_required: true,
    approval_required: true,
    default_currency: 'PKR',
    default_journal_code: 'GENERAL_JNL',
    accounting_rule_code: 'RULE_MANUAL_JOURNAL',
    is_active: true,
  },
};
`,

  'catalog/accounting-event-mapping.ts': `import { BusinessEvent } from '../enums/business-event.enum';
import { AccountingEventContract } from '../contracts/accounting-event.contract';

export const ACCOUNTING_EVENT_MAPPING: Record<BusinessEvent, AccountingEventContract> = {
  [BusinessEvent.POS_SALE]: {
    event: BusinessEvent.POS_SALE,
    voucher_type_code: 'CASH_RECEIPT_VOUCHER',
    journal_type_code: 'SALES_JNL',
    required_system_accounts: ['CASH_IN_HAND', 'SALES_REVENUE'],
    auto_posting: true,
    approval_workflow_code: 'AUTO_APPROVE',
  },
  [BusinessEvent.POS_REFUND]: {
    event: BusinessEvent.POS_REFUND,
    voucher_type_code: 'CASH_PAYMENT_VOUCHER',
    journal_type_code: 'SALES_JNL',
    required_system_accounts: ['CASH_IN_HAND', 'SALES_RETURNS'],
    auto_posting: true,
    approval_workflow_code: 'AUTO_APPROVE',
  },
  [BusinessEvent.POS_VOID]: {
    event: BusinessEvent.POS_VOID,
    voucher_type_code: 'JOURNAL_VOUCHER',
    journal_type_code: 'SALES_JNL',
    required_system_accounts: ['CASH_IN_HAND', 'SALES_REVENUE'],
    auto_posting: false,
    approval_workflow_code: 'MANAGER_APPROVE',
  },
  [BusinessEvent.PURCHASE_INVOICE]: {
    event: BusinessEvent.PURCHASE_INVOICE,
    voucher_type_code: 'JOURNAL_VOUCHER',
    journal_type_code: 'PURCHASE_JNL',
    required_system_accounts: ['INVENTORY_ASSET', 'ACCOUNTS_PAYABLE'],
    auto_posting: false,
    approval_workflow_code: 'MANAGER_APPROVE',
  },
  [BusinessEvent.PURCHASE_RETURN]: {
    event: BusinessEvent.PURCHASE_RETURN,
    voucher_type_code: 'DEBIT_NOTE',
    journal_type_code: 'PURCHASE_JNL',
    required_system_accounts: ['ACCOUNTS_PAYABLE', 'INVENTORY_ASSET'],
    auto_posting: false,
    approval_workflow_code: 'MANAGER_APPROVE',
  },
  [BusinessEvent.GOODS_RECEIPT]: {
    event: BusinessEvent.GOODS_RECEIPT,
    voucher_type_code: 'JOURNAL_VOUCHER',
    journal_type_code: 'INVENTORY_JNL',
    required_system_accounts: ['INVENTORY_ASSET', 'GOODS_RECEIVED_NOT_INVOICED'],
    auto_posting: true,
    approval_workflow_code: 'AUTO_APPROVE',
  },
  [BusinessEvent.INVENTORY_ADJUSTMENT]: {
    event: BusinessEvent.INVENTORY_ADJUSTMENT,
    voucher_type_code: 'JOURNAL_VOUCHER',
    journal_type_code: 'INVENTORY_JNL',
    required_system_accounts: ['INVENTORY_ASSET', 'INVENTORY_SHRINKAGE'],
    auto_posting: false,
    approval_workflow_code: 'MANAGER_APPROVE',
  },
  [BusinessEvent.INVENTORY_CONSUMPTION]: {
    event: BusinessEvent.INVENTORY_CONSUMPTION,
    voucher_type_code: 'JOURNAL_VOUCHER',
    journal_type_code: 'INVENTORY_JNL',
    required_system_accounts: ['COST_OF_GOODS_SOLD', 'INVENTORY_ASSET'],
    auto_posting: true,
    approval_workflow_code: 'AUTO_APPROVE',
  },
  [BusinessEvent.INVENTORY_TRANSFER]: {
    event: BusinessEvent.INVENTORY_TRANSFER,
    voucher_type_code: 'JOURNAL_VOUCHER',
    journal_type_code: 'INVENTORY_JNL',
    required_system_accounts: ['INVENTORY_ASSET_TRANSIT', 'INVENTORY_ASSET'],
    auto_posting: false,
    approval_workflow_code: 'MANAGER_APPROVE',
  },
  [BusinessEvent.PAYROLL_APPROVED]: {
    event: BusinessEvent.PAYROLL_APPROVED,
    voucher_type_code: 'JOURNAL_VOUCHER',
    journal_type_code: 'PAYROLL_JNL',
    required_system_accounts: ['SALARY_EXPENSE', 'SALARY_PAYABLE'],
    auto_posting: false,
    approval_workflow_code: 'FINANCE_APPROVE',
  },
  [BusinessEvent.SALARY_PAID]: {
    event: BusinessEvent.SALARY_PAID,
    voucher_type_code: 'BANK_PAYMENT_VOUCHER',
    journal_type_code: 'CASH_PAYMENT_JNL',
    required_system_accounts: ['SALARY_PAYABLE', 'BANK_ACCOUNT'],
    auto_posting: false,
    approval_workflow_code: 'FINANCE_APPROVE',
  },
  [BusinessEvent.CUSTOMER_PAYMENT]: {
    event: BusinessEvent.CUSTOMER_PAYMENT,
    voucher_type_code: 'CASH_RECEIPT_VOUCHER',
    journal_type_code: 'CASH_RECEIPT_JNL',
    required_system_accounts: ['CASH_IN_HAND', 'ACCOUNTS_RECEIVABLE'],
    auto_posting: true,
    approval_workflow_code: 'AUTO_APPROVE',
  },
  [BusinessEvent.VENDOR_PAYMENT]: {
    event: BusinessEvent.VENDOR_PAYMENT,
    voucher_type_code: 'BANK_PAYMENT_VOUCHER',
    journal_type_code: 'CASH_PAYMENT_JNL',
    required_system_accounts: ['ACCOUNTS_PAYABLE', 'BANK_ACCOUNT'],
    auto_posting: false,
    approval_workflow_code: 'FINANCE_APPROVE',
  },
  [BusinessEvent.BANK_DEPOSIT]: {
    event: BusinessEvent.BANK_DEPOSIT,
    voucher_type_code: 'CONTRA_VOUCHER',
    journal_type_code: 'BANK_JNL',
    required_system_accounts: ['BANK_ACCOUNT', 'CASH_IN_HAND'],
    auto_posting: true,
    approval_workflow_code: 'AUTO_APPROVE',
  },
  [BusinessEvent.BANK_WITHDRAWAL]: {
    event: BusinessEvent.BANK_WITHDRAWAL,
    voucher_type_code: 'CONTRA_VOUCHER',
    journal_type_code: 'BANK_JNL',
    required_system_accounts: ['CASH_IN_HAND', 'BANK_ACCOUNT'],
    auto_posting: false,
    approval_workflow_code: 'MANAGER_APPROVE',
  },
  [BusinessEvent.SUBSCRIPTION_ACTIVATED]: {
    event: BusinessEvent.SUBSCRIPTION_ACTIVATED,
    voucher_type_code: 'JOURNAL_VOUCHER',
    journal_type_code: 'SALES_JNL',
    required_system_accounts: ['ACCOUNTS_RECEIVABLE', 'DEFERRED_REVENUE'],
    auto_posting: true,
    approval_workflow_code: 'AUTO_APPROVE',
  },
  [BusinessEvent.SUBSCRIPTION_RENEWED]: {
    event: BusinessEvent.SUBSCRIPTION_RENEWED,
    voucher_type_code: 'JOURNAL_VOUCHER',
    journal_type_code: 'SALES_JNL',
    required_system_accounts: ['ACCOUNTS_RECEIVABLE', 'DEFERRED_REVENUE'],
    auto_posting: true,
    approval_workflow_code: 'AUTO_APPROVE',
  },
  [BusinessEvent.SUBSCRIPTION_CANCELLED]: {
    event: BusinessEvent.SUBSCRIPTION_CANCELLED,
    voucher_type_code: 'JOURNAL_VOUCHER',
    journal_type_code: 'SALES_JNL',
    required_system_accounts: ['DEFERRED_REVENUE', 'SALES_REVENUE'],
    auto_posting: true,
    approval_workflow_code: 'AUTO_APPROVE',
  },
  [BusinessEvent.ASSET_PURCHASE]: {
    event: BusinessEvent.ASSET_PURCHASE,
    voucher_type_code: 'JOURNAL_VOUCHER',
    journal_type_code: 'GENERAL_JNL',
    required_system_accounts: ['FIXED_ASSET', 'BANK_ACCOUNT'],
    auto_posting: false,
    approval_workflow_code: 'FINANCE_APPROVE',
  },
  [BusinessEvent.ASSET_DISPOSAL]: {
    event: BusinessEvent.ASSET_DISPOSAL,
    voucher_type_code: 'JOURNAL_VOUCHER',
    journal_type_code: 'GENERAL_JNL',
    required_system_accounts: ['BANK_ACCOUNT', 'FIXED_ASSET', 'GAIN_LOSS_ASSET'],
    auto_posting: false,
    approval_workflow_code: 'FINANCE_APPROVE',
  },
  [BusinessEvent.MANUAL_JOURNAL]: {
    event: BusinessEvent.MANUAL_JOURNAL,
    voucher_type_code: 'JOURNAL_VOUCHER',
    journal_type_code: 'GENERAL_JNL',
    required_system_accounts: [],
    auto_posting: false,
    approval_workflow_code: 'MANAGER_APPROVE',
  },
};
`,

  // API Controller
  'controllers/event-catalog.controller.ts': `import { Controller, Get, Param, NotFoundException, BadRequestException } from '@nestjs/common';
import { BusinessEvent } from '../enums/business-event.enum';
import { BUSINESS_EVENT_CATALOG } from '../catalog/business-event-catalog';
import { ACCOUNTING_EVENT_MAPPING } from '../catalog/accounting-event-mapping';

@Controller('accounting/event-catalog')
export class EventCatalogController {

  @Get()
  getCatalog() {
    return {
      events: BUSINESS_EVENT_CATALOG,
      mappings: ACCOUNTING_EVENT_MAPPING,
    };
  }

  @Get(':event')
  getEventMapping(@Param('event') event: string) {
    if (!Object.values(BusinessEvent).includes(event as BusinessEvent)) {
      throw new BadRequestException(\`Unknown event: \${event}\`);
    }

    const businessEvent = BUSINESS_EVENT_CATALOG[event as BusinessEvent];
    const accountingMapping = ACCOUNTING_EVENT_MAPPING[event as BusinessEvent];

    if (!businessEvent) {
      throw new NotFoundException(\`Business event configuration not found for: \${event}\`);
    }

    if (!businessEvent.is_active) {
      throw new BadRequestException(\`Event \${event} is currently inactive.\`);
    }

    if (!accountingMapping) {
      throw new NotFoundException(\`Accounting mapping not found for: \${event}\`);
    }

    return {
      event: businessEvent,
      mapping: accountingMapping,
    };
  }
}
`,

  // Indexing updates - Export Contracts
  'contracts/index.ts': `export * from './business-event.contract';
export * from './accounting-event.contract';
`,

  // Indexing updates - Export Catalogs
  'catalog/index.ts': `export * from './business-event-catalog';
export * from './accounting-event-mapping';
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
