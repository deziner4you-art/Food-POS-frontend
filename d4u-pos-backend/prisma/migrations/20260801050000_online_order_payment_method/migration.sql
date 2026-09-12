-- Captures the customer's stated payment-method preference at website
-- checkout (CASH/CARD/COD/WALLET). Previously discarded entirely -- the
-- backend's CreateOnlineOrderDto never declared this field, so it was
-- silently stripped by the global ValidationPipe whitelist, and every POS
-- Order created from an online order was hardcoded to CASH regardless of
-- what the customer actually selected. Nullable/optional: no payment
-- gateway exists yet, this is intent captured for the kitchen/rider and to
-- seed the real Order.payment_method at Accept time, not a completed
-- transaction. Every pre-existing OnlineOrder row stays valid with no
-- CreateTable
CREATE TABLE "OnlineOrder" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL DEFAULT 1,
    "orderId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "kdsStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "type" TEXT NOT NULL DEFAULT 'Online',
    "source" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL DEFAULT '',
    "customerAddress" TEXT NOT NULL DEFAULT '',
    "items" TEXT NOT NULL,
    "totalAmount" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "prepTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "estimatedReadyAt" TEXT NOT NULL DEFAULT '',
    "timePlaced" TEXT NOT NULL,
    "riderAssigned" BOOLEAN NOT NULL DEFAULT false,
    "feedback" JSONB,
    "delivery" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kot_id" INTEGER,
    "paymentMethod" TEXT,

    CONSTRAINT "OnlineOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnlineOrder_orderId_key" ON "OnlineOrder"("orderId");
CREATE UNIQUE INDEX "OnlineOrder_kot_id_key" ON "OnlineOrder"("kot_id");

-- AddForeignKey
ALTER TABLE "OnlineOrder" ADD CONSTRAINT "OnlineOrder_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OnlineOrder" ADD CONSTRAINT "OnlineOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OnlineOrder" ADD CONSTRAINT "OnlineOrder_kot_id_fkey" FOREIGN KEY ("kot_id") REFERENCES "KOT"("id") ON DELETE SET NULL ON UPDATE CASCADE;
