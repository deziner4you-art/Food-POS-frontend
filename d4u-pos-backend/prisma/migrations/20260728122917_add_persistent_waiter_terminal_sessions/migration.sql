-- CreateTable
CREATE TABLE "TerminalSession" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "pin" TEXT NOT NULL,
    "waiter_name" TEXT NOT NULL,
    "device_id" TEXT,
    "device_name" TEXT,
    "table_no" TEXT,
    "socket_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "connected_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3),
    "logged_out_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TerminalSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TerminalSession_pin_key" ON "TerminalSession"("pin");

-- CreateIndex
CREATE INDEX "TerminalSession_store_id_idx" ON "TerminalSession"("store_id");

-- CreateIndex
CREATE INDEX "TerminalSession_device_id_idx" ON "TerminalSession"("device_id");

-- AddForeignKey
ALTER TABLE "TerminalSession" ADD CONSTRAINT "TerminalSession_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "terminal_session_id" INTEGER;
