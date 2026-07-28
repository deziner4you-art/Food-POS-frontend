-- AlterTable
ALTER TABLE "TerminalSession"
  ADD COLUMN "device_id" TEXT,
  ADD COLUMN "device_name" TEXT,
  ADD COLUMN "table_no" TEXT,
  ADD COLUMN "socket_id" TEXT,
  ADD COLUMN "connected_at" TIMESTAMP(3),
  ADD COLUMN "last_activity_at" TIMESTAMP(3),
  ADD COLUMN "logged_out_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "TerminalSession_store_id_idx" ON "TerminalSession"("store_id");

-- CreateIndex
CREATE INDEX "TerminalSession_device_id_idx" ON "TerminalSession"("device_id");

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "terminal_session_id" INTEGER;
