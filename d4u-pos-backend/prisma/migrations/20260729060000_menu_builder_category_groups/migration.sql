-- Sprint 28.7: Menu Builder Category Groups — additive, backward compatible.
-- Hierarchy becomes: Menu Collection -> Category Group -> Category -> Product.
-- Category.category_group_id is added NULLABLE here; a follow-up data-backfill
-- script (run once, outside this file) assigns every existing Category to a
-- per-Menu "Default Group", after which a second migration sets it NOT NULL.

-- CreateTable
CREATE TABLE "Menu" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "_MenuStores" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_MenuStores_AB_unique" ON "_MenuStores"("A", "B");
CREATE INDEX "_MenuStores_B_index" ON "_MenuStores"("B");

-- AddForeignKey
ALTER TABLE "_MenuStores" ADD CONSTRAINT "_MenuStores_A_fkey" FOREIGN KEY ("A") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_MenuStores" ADD CONSTRAINT "_MenuStores_B_fkey" FOREIGN KEY ("B") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable Category
ALTER TABLE "Category" ADD COLUMN "menu_id" INTEGER;
ALTER TABLE "Category" ADD CONSTRAINT "Category_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "Menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable CategoryGroup
CREATE TABLE "CategoryGroup" (
    "id" SERIAL NOT NULL,
    "menu_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "color" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "visible_pos" BOOLEAN NOT NULL DEFAULT true,
    "visible_website" BOOLEAN NOT NULL DEFAULT true,
    "visible_waiter" BOOLEAN NOT NULL DEFAULT true,
    "visible_qr_menu" BOOLEAN NOT NULL DEFAULT true,
    "visible_kiosk" BOOLEAN NOT NULL DEFAULT true,
    "visible_delivery" BOOLEAN NOT NULL DEFAULT true,
    "visible_takeaway" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "CategoryGroup_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CategoryGroup_menu_id_idx" ON "CategoryGroup"("menu_id");

ALTER TABLE "CategoryGroup" ADD CONSTRAINT "CategoryGroup_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable _CategoryGroupStores (implicit m2m, mirrors _CategoryStores/_ProductStores)
CREATE TABLE "_CategoryGroupStores" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

CREATE UNIQUE INDEX "_CategoryGroupStores_AB_unique" ON "_CategoryGroupStores"("A", "B");
CREATE INDEX "_CategoryGroupStores_B_index" ON "_CategoryGroupStores"("B");

ALTER TABLE "_CategoryGroupStores" ADD CONSTRAINT "_CategoryGroupStores_A_fkey" FOREIGN KEY ("A") REFERENCES "CategoryGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CategoryGroupStores" ADD CONSTRAINT "_CategoryGroupStores_B_fkey" FOREIGN KEY ("B") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable Category — nullable for now, backfilled by scripts/backfill-category-groups.ts, then locked NOT NULL by the next migration.
ALTER TABLE "Category" ADD COLUMN "category_group_id" INTEGER;

CREATE INDEX "Category_category_group_id_idx" ON "Category"("category_group_id");

ALTER TABLE "Category" ADD CONSTRAINT "Category_category_group_id_fkey" FOREIGN KEY ("category_group_id") REFERENCES "CategoryGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
