import { Module } from '@nestjs/common';

import { SystemAccountMappingController, ChartOfAccountsController, FiscalYearController, AccountingPeriodController, JournalController, JournalEntryController, GeneralLedgerController, PostingController, VoucherController } from './controllers';
import { SystemAccountMappingService, ChartOfAccountsService, FiscalYearService, AccountingPeriodService, JournalService, JournalEntryService, GeneralLedgerService, PostingEngineService, VoucherService } from './services';
import { SystemAccountMappingRepository, AccountGroupRepository, AccountRepository, FiscalYearRepository, AccountingPeriodRepository, JournalRepository, JournalEntryRepository, JournalEntryLineRepository, GeneralLedgerRepository, VoucherRepository } from './repositories';
import { PostingValidatorService } from './validators';
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
  ],
  exports: [],
})
export class AccountingModule {}
