-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "currency_id" INTEGER,
ADD COLUMN     "reference_number" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_store_id_reference_number_key" ON "JournalEntry"("store_id", "reference_number");

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

