-- CreateTable
CREATE TABLE "RestaurantTable" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "current_order_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantTable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RestaurantTable_store_id_idx" ON "RestaurantTable"("store_id");

-- CreateIndex
CREATE INDEX "RestaurantTable_current_order_id_idx" ON "RestaurantTable"("current_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantTable_store_id_label_key" ON "RestaurantTable"("store_id", "label");
