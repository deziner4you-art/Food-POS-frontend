-- KDS Backend Foundation — additive only, no existing table/column altered destructively.

-- AlterTable Product (additive optional FK, legacy kitchen_station string untouched)
ALTER TABLE "Product" ADD COLUMN "kitchen_station_id" INTEGER;

-- CreateTable KitchenStation
CREATE TABLE "KitchenStation" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KitchenStation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KitchenStation_store_id_name_key" ON "KitchenStation"("store_id", "name");
CREATE INDEX "KitchenStation_store_id_idx" ON "KitchenStation"("store_id");

ALTER TABLE "KitchenStation" ADD CONSTRAINT "KitchenStation_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey Product -> KitchenStation
ALTER TABLE "Product" ADD CONSTRAINT "Product_kitchen_station_id_fkey" FOREIGN KEY ("kitchen_station_id") REFERENCES "KitchenStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable ChefSession
CREATE TABLE "ChefSession" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "pin" TEXT NOT NULL,
    "chef_name" TEXT NOT NULL,
    "kitchen_station_id" INTEGER,
    "device_id" TEXT,
    "device_name" TEXT,
    "socket_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "connected_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3),
    "logged_out_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChefSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChefSession_pin_key" ON "ChefSession"("pin");
CREATE INDEX "ChefSession_store_id_idx" ON "ChefSession"("store_id");
CREATE INDEX "ChefSession_device_id_idx" ON "ChefSession"("device_id");

ALTER TABLE "ChefSession" ADD CONSTRAINT "ChefSession_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChefSession" ADD CONSTRAINT "ChefSession_kitchen_station_id_fkey" FOREIGN KEY ("kitchen_station_id") REFERENCES "KitchenStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable StockRequest
CREATE TABLE "StockRequest" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "inventory_id" INTEGER NOT NULL,
    "kitchen_station_id" INTEGER,
    "chef_session_id" INTEGER,
    "requested_by_name" TEXT,
    "requested_qty" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "approved_by" INTEGER,
    "fulfilled_qty" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "StockRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StockRequest_store_id_idx" ON "StockRequest"("store_id");
CREATE INDEX "StockRequest_inventory_id_idx" ON "StockRequest"("inventory_id");

ALTER TABLE "StockRequest" ADD CONSTRAINT "StockRequest_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockRequest" ADD CONSTRAINT "StockRequest_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockRequest" ADD CONSTRAINT "StockRequest_kitchen_station_id_fkey" FOREIGN KEY ("kitchen_station_id") REFERENCES "KitchenStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockRequest" ADD CONSTRAINT "StockRequest_chef_session_id_fkey" FOREIGN KEY ("chef_session_id") REFERENCES "ChefSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable InventoryLock
CREATE TABLE "InventoryLock" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "inventory_id" INTEGER NOT NULL,
    "kot_id" INTEGER,
    "reason" TEXT,
    "locked_by" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "released_by" INTEGER,

    CONSTRAINT "InventoryLock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryLock_store_id_idx" ON "InventoryLock"("store_id");
CREATE INDEX "InventoryLock_inventory_id_idx" ON "InventoryLock"("inventory_id");

ALTER TABLE "InventoryLock" ADD CONSTRAINT "InventoryLock_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryLock" ADD CONSTRAINT "InventoryLock_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryLock" ADD CONSTRAINT "InventoryLock_kot_id_fkey" FOREIGN KEY ("kot_id") REFERENCES "KOT"("id") ON DELETE SET NULL ON UPDATE CASCADE;
