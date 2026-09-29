import { REQUIRED_MODULE_KEY } from '../../common/decorators/require-module.decorator';
import { InventoryController } from './inventory/inventory.controller';
import { RecipesController } from './recipes/recipes.controller';
import { VendorController } from './vendor/vendor.controller';
import { CustomersController } from './customers/customers.controller';
import { CustomerAddressesController } from './customer-addresses/customer-addresses.controller';
import { ReportsController } from './reports/reports.controller';
import {
  AccountingPeriodController,
  AccountingRulesController,
  AccountsPayableController,
  AccountsReceivableController,
  BalanceSheetController,
  BankReconciliationController,
  BudgetController,
  CashFlowController,
  ChartOfAccountsController,
  ComparativeReportingController,
  ComplianceController,
  DepreciationController,
  EventCatalogController,
  FinancialDashboardController,
  FinancialExportController,
  FinancialKpiController,
  FinancialStatementController,
  FiscalYearController,
  FixedAssetController,
  GeneralLedgerReportController,
  GeneralLedgerController,
  JournalEntryController,
  JournalController,
  MonthEndController,
  PostingController,
  ProfitLossController,
  SystemAccountMappingController,
  TreasuryController,
  TrialBalanceController,
  VoucherController,
  YearEndClosingController,
} from './accounting/controllers';

describe('secondary SaaS module controller boundaries', () => {
  const moduleControllers: Array<[Function, string]> = [
    [InventoryController, 'INVENTORY'],
    [RecipesController, 'RECIPES'],
    [VendorController, 'VENDORS'],
    [CustomersController, 'CRM'],
  [CustomerAddressesController, 'CRM'],
    [ReportsController, 'ANALYTICS'],
    [AccountingPeriodController, 'ACCOUNTING'],
    [AccountingRulesController, 'ACCOUNTING'],
    [AccountsPayableController, 'ACCOUNTING'],
    [AccountsReceivableController, 'ACCOUNTING'],
    [BalanceSheetController, 'ACCOUNTING'],
    [BankReconciliationController, 'ACCOUNTING'],
    [BudgetController, 'ACCOUNTING'],
    [CashFlowController, 'ACCOUNTING'],
    [ChartOfAccountsController, 'ACCOUNTING'],
    [ComparativeReportingController, 'ACCOUNTING'],
    [ComplianceController, 'ACCOUNTING'],
    [DepreciationController, 'ACCOUNTING'],
    [EventCatalogController, 'ACCOUNTING'],
    [FinancialDashboardController, 'ACCOUNTING'],
    [FinancialExportController, 'ACCOUNTING'],
    [FinancialKpiController, 'ACCOUNTING'],
    [FinancialStatementController, 'ACCOUNTING'],
    [FiscalYearController, 'ACCOUNTING'],
    [FixedAssetController, 'ACCOUNTING'],
    [GeneralLedgerReportController, 'ACCOUNTING'],
    [GeneralLedgerController, 'ACCOUNTING'],
    [JournalEntryController, 'ACCOUNTING'],
    [JournalController, 'ACCOUNTING'],
    [MonthEndController, 'ACCOUNTING'],
    [PostingController, 'ACCOUNTING'],
    [ProfitLossController, 'ACCOUNTING'],
    [SystemAccountMappingController, 'ACCOUNTING'],
    [TreasuryController, 'ACCOUNTING'],
    [TrialBalanceController, 'ACCOUNTING'],
    [VoucherController, 'ACCOUNTING'],
    [YearEndClosingController, 'ACCOUNTING'],
  ];

  it.each(moduleControllers)('%p requires the %s package module', (controller, moduleKey) => {
    expect(Reflect.getMetadata(REQUIRED_MODULE_KEY, controller)).toBe(moduleKey);
  });
});
