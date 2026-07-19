-- CreateTable
CREATE TABLE "GeneralLedger" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "journal_entry_id" INTEGER NOT NULL,
    "journal_entry_line_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "debit" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "credit" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "running_balance" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "posting_date" TIMESTAMP(3) NOT NULL,
    "fiscal_year_id" INTEGER NOT NULL,
    "accounting_period_id" INTEGER NOT NULL,
    "reference" TEXT,
    "currency_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneralLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneralLedger_journal_entry_line_id_key" ON "GeneralLedger"("journal_entry_line_id");

-- CreateIndex
CREATE INDEX "GeneralLedger_store_id_account_id_idx" ON "GeneralLedger"("store_id", "account_id");

-- CreateIndex
CREATE INDEX "GeneralLedger_store_id_posting_date_idx" ON "GeneralLedger"("store_id", "posting_date");

-- CreateIndex
CREATE INDEX "GeneralLedger_store_id_fiscal_year_id_idx" ON "GeneralLedger"("store_id", "fiscal_year_id");

-- AddForeignKey
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "JournalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_journal_entry_line_id_fkey" FOREIGN KEY ("journal_entry_line_id") REFERENCES "JournalEntryLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_fiscal_year_id_fkey" FOREIGN KEY ("fiscal_year_id") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_accounting_period_id_fkey" FOREIGN KEY ("accounting_period_id") REFERENCES "AccountingPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedger" ADD CONSTRAINT "GeneralLedger_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

