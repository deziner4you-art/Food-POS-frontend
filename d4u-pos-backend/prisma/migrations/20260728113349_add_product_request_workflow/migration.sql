-- CreateTable
CREATE TABLE "ProductRequest" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "requested_by" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" INTEGER,
    "suggested_price" DOUBLE PRECISION NOT NULL,
    "sku" TEXT,
    "image_url" TEXT,
    "thumbnail_url" TEXT,
    "recipe_notes" TEXT,
    "recipe_id" INTEGER,
    "kitchen_station" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "hq_comments" TEXT,
    "approved_by" INTEGER,
    "approved_at" TIMESTAMP(3),
    "created_product_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRequestAuditLog" (
    "id" SERIAL NOT NULL,
    "product_request_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" INTEGER,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductRequestAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductRequest_store_id_idx" ON "ProductRequest"("store_id");

-- CreateIndex
CREATE INDEX "ProductRequest_status_idx" ON "ProductRequest"("status");

-- CreateIndex
CREATE INDEX "ProductRequestAuditLog_product_request_id_idx" ON "ProductRequestAuditLog"("product_request_id");

-- AddForeignKey
ALTER TABLE "ProductRequestAuditLog" ADD CONSTRAINT "ProductRequestAuditLog_product_request_id_fkey" FOREIGN KEY ("product_request_id") REFERENCES "ProductRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
