-- Sprint 28.8D: Menu Builder Enterprise Management — additive only.

-- Product List API requires "Updated At"; Product never had this field.
ALTER TABLE "Product" 
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "sku" TEXT,
  ADD COLUMN "barcode" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "internal_notes" TEXT,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'APPROVED';

-- List/filter/sort performance (bulk assignment, Product List, Category List).
CREATE INDEX "Product_store_id_idx" ON "Product"("store_id");
CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE INDEX "Category_store_id_idx" ON "Category"("store_id");
CREATE INDEX "Category_menu_id_idx" ON "Category"("menu_id");
