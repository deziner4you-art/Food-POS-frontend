import { Module } from '@nestjs/common';

import { SystemAccountMappingController, ChartOfAccountsController, FiscalYearController, AccountingPeriodController, JournalController, JournalEntryController, GeneralLedgerController, PostingController, VoucherController, AccountingRulesController, EventCatalogController } from './controllers';
import { SystemAccountMappingService, ChartOfAccountsService, FiscalYearService, AccountingPeriodService, JournalService, JournalEntryService, GeneralLedgerService, PostingEngineService, VoucherService, AccountingRulesService, AccountingIntegrationService, InventoryValuationService, InventoryLedgerService, StockCountService, InventoryReconciliationService, WasteManagementService, BatchManagementService, BatchAllocationService, ExpiryMonitorService } from './services';
import { SystemAccountMappingRepository, AccountGroupRepository, AccountRepository, FiscalYearRepository, AccountingPeriodRepository, JournalRepository, JournalEntryRepository, JournalEntryLineRepository, GeneralLedgerRepository, VoucherRepository, PostingRuleRepository, InventoryLedgerRepository, StockCountRepository, WasteRepository, BatchRepository } from './repositories';
import { PostingValidatorService, PostingRuleValidator, AccountingIntegrationValidator, PosAccountingValidator, RecipeAccountingValidator, PurchaseAccountingValidator, InventoryValuationValidator, InventoryLedgerValidator, StockCountValidator, WasteValidator, BatchValidator } from './validators';
import { DomainEventBusService } from './events';
import { JournalPostingListener, VoucherListener } from './listeners';
import { AccountingRequestFactory } from './factories';
import { PosAccountingIntegration, RecipeAccountingIntegration, PurchaseAccountingIntegration } from './integrations';
import { PosSaleMapper, PosRefundMapper, RecipeConsumptionMapper, COGSMapper, GoodsReceiptMapper, SupplierInvoiceMapper, PurchaseReturnMapper } from './mappers';
import { FIFOStrategy, WeightedAverageStrategy, StandardCostStrategy } from './strategies';
import { PrismaModule } from '../../../database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    SystemAccountMappingController,
    ChartOfAccountsController,
    FiscalYearController,
    AccountingPeriodController,
    JournalController,
    JournalEntryController,
    GeneralLedgerController,
    PostingController,
    VoucherController,
    AccountingRulesController,
    EventCatalogController,
  ],
  providers: [
    SystemAccountMappingService,
    SystemAccountMappingRepository,
    ChartOfAccountsService,
    AccountGroupRepository,
    AccountRepository,
    FiscalYearService,
    AccountingPeriodService,
    FiscalYearRepository,
    AccountingPeriodRepository,
    JournalService,
    JournalRepository,
    JournalEntryService,
    JournalEntryRepository,
    JournalEntryLineRepository,
    GeneralLedgerService,
    GeneralLedgerRepository,
    PostingEngineService,
    PostingValidatorService,
    VoucherService,
    VoucherRepository,
    DomainEventBusService,
    JournalPostingListener,
    VoucherListener,
    AccountingRulesService,
    PostingRuleRepository,
    PostingRuleValidator,
    AccountingIntegrationService,
    AccountingIntegrationValidator,
    AccountingRequestFactory,
    PosAccountingValidator,
    PosSaleMapper,
    PosRefundMapper,
    PosAccountingIntegration,
    RecipeAccountingValidator,
    RecipeConsumptionMapper,
    COGSMapper,
    RecipeAccountingIntegration,
    PurchaseAccountingValidator,
    GoodsReceiptMapper,
    SupplierInvoiceMapper,
    PurchaseReturnMapper,
    PurchaseAccountingIntegration,
    InventoryValuationValidator,
    FIFOStrategy,
    WeightedAverageStrategy,
    StandardCostStrategy,
    InventoryValuationService,
    InventoryLedgerRepository,
    InventoryLedgerValidator,
    InventoryLedgerService,
    StockCountRepository,
    StockCountValidator,
    StockCountService,
    InventoryReconciliationService,
    WasteRepository,
    WasteValidator,
    WasteManagementService,
    BatchRepository,
    BatchValidator,
    BatchManagementService,
    BatchAllocationService,
    ExpiryMonitorService,
  ],
  exports: [],
})
export class AccountingModule {}
