-- AlterTable
ALTER TABLE "Journal" ADD COLUMN     "allow_automatic_entries" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allow_manual_entries" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "default_currency_id" INTEGER,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_system_generated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "require_approval" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Journal_store_id_code_key" ON "Journal"("store_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Journal_store_id_name_key" ON "Journal"("store_id", "name");

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_default_currency_id_fkey" FOREIGN KEY ("default_currency_id") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

