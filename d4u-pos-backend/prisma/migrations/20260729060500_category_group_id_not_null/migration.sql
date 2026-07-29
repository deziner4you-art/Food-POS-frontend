-- Sprint 28.7 follow-up: every Category now has a category_group_id (backfilled
-- by _backfill_category_groups.ts — every existing row assigned to a per-Menu
-- "Default Group"). Lock the column NOT NULL to match the Prisma schema.
ALTER TABLE "Category" ALTER COLUMN "category_group_id" SET NOT NULL;
