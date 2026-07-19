const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // --- ENUMS ---
  'enums/account-type.enum.ts': `export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}
`,
  'enums/account-category.enum.ts': `export enum AccountCategory {
  CURRENT_ASSET = 'CURRENT_ASSET',
  FIXED_ASSET = 'FIXED_ASSET',
  CURRENT_LIABILITY = 'CURRENT_LIABILITY',
  LONG_TERM_LIABILITY = 'LONG_TERM_LIABILITY',
  OWNERS_EQUITY = 'OWNERS_EQUITY',
  OPERATING_REVENUE = 'OPERATING_REVENUE',
  NON_OPERATING_REVENUE = 'NON_OPERATING_REVENUE',
  COST_OF_GOODS_SOLD = 'COST_OF_GOODS_SOLD',
  OPERATING_EXPENSE = 'OPERATING_EXPENSE',
  NON_OPERATING_EXPENSE = 'NON_OPERATING_EXPENSE',
}
`,
  'enums/journal-status.enum.ts': `export enum JournalStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
}
`,
  'enums/journal-type.enum.ts': `export enum JournalType {
  GENERAL = 'GENERAL',
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
  CASH = 'CASH',
  BANK = 'BANK',
  OPENING_BALANCE = 'OPENING_BALANCE',
}
`,
  'enums/voucher-type.enum.ts': `export enum VoucherType {
  RECEIPT = 'RECEIPT',
  PAYMENT = 'PAYMENT',
  JOURNAL = 'JOURNAL',
  CONTRA = 'CONTRA',
}
`,
  'enums/voucher-status.enum.ts': `export enum VoucherStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  POSTED = 'POSTED',
  CANCELLED = 'CANCELLED',
}
`,
  'enums/accounting-period-status.enum.ts': `export enum AccountingPeriodStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}
`,
  'enums/currency-rounding.enum.ts': `export enum CurrencyRounding {
  NONE = 'NONE',
  ROUND_UP = 'ROUND_UP',
  ROUND_DOWN = 'ROUND_DOWN',
  NEAREST = 'NEAREST',
}
`,
  'enums/system-account-type.enum.ts': `export enum SystemAccountType {
  DEFAULT_CASH = 'DEFAULT_CASH',
  DEFAULT_AR = 'DEFAULT_AR',
  DEFAULT_AP = 'DEFAULT_AP',
  INVENTORY_ASSET = 'INVENTORY_ASSET',
  COGS = 'COGS',
  SALES_REVENUE = 'SALES_REVENUE',
  VAT_PAYABLE = 'VAT_PAYABLE',
  RETAINED_EARNINGS = 'RETAINED_EARNINGS',
  OPENING_BALANCE_EQUITY = 'OPENING_BALANCE_EQUITY',
}
`,

  // --- ENUM BARREL ---
  'enums/index.ts': `export * from './account-type.enum';
export * from './account-category.enum';
export * from './journal-status.enum';
export * from './journal-type.enum';
export * from './voucher-type.enum';
export * from './voucher-status.enum';
export * from './accounting-period-status.enum';
export * from './currency-rounding.enum';
export * from './system-account-type.enum';
`,

  // --- INTERFACES ---
  'interfaces/account.interface.ts': `import { AccountType } from '../enums/account-type.enum';
import { AccountCategory } from '../enums/account-category.enum';

export interface IAccount {
  id: number;
  store_id: number;
  name: string;
  code: string;
  type: AccountType;
  category: AccountCategory;
  parent_account_id?: number | null;
  currency_id?: number | null;
  is_group: boolean;
  is_active: boolean;
  opening_balance: number;
  created_at: Date;
  updated_at: Date;
}
`,
  'interfaces/journal.interface.ts': `import { JournalType } from '../enums/journal-type.enum';

export interface IJournal {
  id: number;
  store_id: number;
  name: string;
  type: JournalType;
  prefix: string;
  created_at: Date;
  updated_at: Date;
}
`,
  'interfaces/journal-entry.interface.ts': `import { JournalStatus } from '../enums/journal-status.enum';
import { ILedgerEntry } from './ledger-entry.interface';

export interface IJournalEntry {
  id: number;
  store_id: number;
  journal_id: number;
  fiscal_year_id: number;
  accounting_period_id: number;
  posting_date: Date;
  reference_type?: string | null;
  reference_id?: number | string | null;
  description?: string | null;
  total_amount: number;
  status: JournalStatus;
  lines?: ILedgerEntry[];
  created_by?: number | null;
  created_at: Date;
  updated_at: Date;
}
`,
  'interfaces/ledger-entry.interface.ts': `export interface ILedgerEntry {
  id: number;
  store_id: number;
  journal_entry_id: number;
  account_id: number;
  debit_amount: number;
  credit_amount: number;
  description?: string | null;
  cost_center_id?: number | null;
  profit_center_id?: number | null;
  party_type?: string | null;
  party_id?: number | null;
  created_at: Date;
  updated_at: Date;
}
`,
  'interfaces/voucher.interface.ts': `import { VoucherType } from '../enums/voucher-type.enum';
import { VoucherStatus } from '../enums/voucher-status.enum';

export interface IVoucher {
  id: number;
  store_id: number;
  voucher_type: VoucherType;
  voucher_number: string;
  date: Date;
  amount: number;
  notes?: string | null;
  status: VoucherStatus;
  created_by?: number | null;
  created_at: Date;
  updated_at: Date;
}
`,
  'interfaces/fiscal-year.interface.ts': `export interface IFiscalYear {
  id: number;
  store_id: number;
  start_date: Date;
  end_date: Date;
  is_closed: boolean;
  created_at: Date;
  updated_at: Date;
}
`,
  'interfaces/accounting-period.interface.ts': `import { AccountingPeriodStatus } from '../enums/accounting-period-status.enum';

export interface IAccountingPeriod {
  id: number;
  store_id: number;
  fiscal_year_id: number;
  month: number;
  year: number;
  start_date: Date;
  end_date: Date;
  status: AccountingPeriodStatus;
  created_at: Date;
  updated_at: Date;
}
`,
  'interfaces/currency.interface.ts': `import { CurrencyRounding } from '../enums/currency-rounding.enum';

export interface ICurrency {
  id: number;
  code: string;
  symbol: string;
  rounding_method: CurrencyRounding;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
`,
  'interfaces/exchange-rate.interface.ts': `export interface IExchangeRate {
  id: number;
  store_id: number;
  base_currency_id: number;
  target_currency_id: number;
  rate: number;
  effective_date: Date;
  created_at: Date;
  updated_at: Date;
}
`,
  'interfaces/cost-center.interface.ts': `export interface ICostCenter {
  id: number;
  store_id: number;
  code: string;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
`,
  'interfaces/profit-center.interface.ts': `export interface IProfitCenter {
  id: number;
  store_id: number;
  code: string;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
`,
  'interfaces/system-account.interface.ts': `import { SystemAccountType } from '../enums/system-account-type.enum';

export interface ISystemAccountMapping {
  id: number;
  store_id: number;
  mapping_type: SystemAccountType;
  account_id: number;
  created_at: Date;
  updated_at: Date;
}
`,

  // --- INTERFACES BARREL ---
  'interfaces/index.ts': `export * from './account.interface';
export * from './journal.interface';
export * from './journal-entry.interface';
export * from './ledger-entry.interface';
export * from './voucher.interface';
export * from './fiscal-year.interface';
export * from './accounting-period.interface';
export * from './currency.interface';
export * from './exchange-rate.interface';
export * from './cost-center.interface';
export * from './profit-center.interface';
export * from './system-account.interface';
`,

  // --- CONSTANTS ---
  'constants/accounting.constants.ts': `export const ACCOUNTING_CONSTANTS = {
  MAX_ACCOUNT_CODE_LENGTH: 50,
  MIN_JOURNAL_LINES: 2,
};
`,
  'constants/accounting-events.constants.ts': `export const ACCOUNTING_EVENTS = {
  // Sales
  ORDER_SETTLED_CASH: 'ORDER_SETTLED_CASH',
  ORDER_SETTLED_CARD: 'ORDER_SETTLED_CARD',
  ORDER_SETTLED_CREDIT: 'ORDER_SETTLED_CREDIT',
  ORDER_SETTLED_SPLIT: 'ORDER_SETTLED_SPLIT',
  ORDER_REFUNDED: 'ORDER_REFUNDED',
  ORDER_RETURNED: 'ORDER_RETURNED',
  
  // Inventory
  INVENTORY_RECEIVED: 'INVENTORY_RECEIVED',
  ORDER_DISPATCHED: 'ORDER_DISPATCHED',
  STOCK_WASTED: 'STOCK_WASTED',
  STOCK_DAMAGED: 'STOCK_DAMAGED',
  STOCK_ADJUSTED_UP: 'STOCK_ADJUSTED_UP',
  STOCK_ADJUSTED_DOWN: 'STOCK_ADJUSTED_DOWN',
  STOCK_TRANSFERRED: 'STOCK_TRANSFERRED',
  OPENING_STOCK_POSTED: 'OPENING_STOCK_POSTED',
  
  // Purchasing
  VENDOR_INVOICE_RCVD: 'VENDOR_INVOICE_RCVD',
  VENDOR_PAYMENT_MADE: 'VENDOR_PAYMENT_MADE',
  PO_RETURNED: 'PO_RETURNED',
  
  // Cash & Banking
  CASH_DEPOSITED: 'CASH_DEPOSITED',
  CASH_WITHDRAWN: 'CASH_WITHDRAWN',
  BANK_TRANSFERRED: 'BANK_TRANSFERRED',
  
  // Payroll
  PAYROLL_GENERATED: 'PAYROLL_GENERATED',
  SALARY_DISBURSED: 'SALARY_DISBURSED',
  
  // SaaS
  SUBSCRIPTION_BOUGHT: 'SUBSCRIPTION_BOUGHT',
  SUBSCRIPTION_RENEWED: 'SUBSCRIPTION_RENEWED',
  INVOICE_GENERATED: 'INVOICE_GENERATED',
  SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
  
  // Period
  PERIOD_CLOSED: 'PERIOD_CLOSED',
  YEAR_CLOSED: 'YEAR_CLOSED',
  YEAR_OPENED: 'YEAR_OPENED',
};
`,
  'constants/accounting-permissions.constants.ts': `export const ACCOUNTING_PERMISSIONS = {
  ACCOUNTS_READ: 'accounting.accounts.read',
  ACCOUNTS_CREATE: 'accounting.accounts.create',
  ACCOUNTS_UPDATE: 'accounting.accounts.update',
  ACCOUNTS_DELETE: 'accounting.accounts.delete',
  
  JOURNALS_READ: 'accounting.journals.read',
  JOURNALS_POST: 'accounting.journals.post',
  JOURNALS_REVERSE: 'accounting.journals.reverse',
  
  PERIOD_CLOSE: 'accounting.period.close',
  
  REPORTS_VIEW: 'accounting.reports.view',
  
  SETTINGS_MANAGE: 'accounting.settings.manage',
};
`,

  // --- CONSTANTS BARREL ---
  'constants/index.ts': `export * from './accounting.constants';
export * from './accounting-events.constants';
export * from './accounting-permissions.constants';
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
