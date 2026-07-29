-- HOTFIX: Category Groups are now OPTIONAL (business requirement change).
-- A restaurant may use Menu -> Categories -> Products with zero groups.
-- Reverses the Sprint 28.7 NOT NULL constraint and the RESTRICT delete rule
-- that existed only to support the now-removed "auto-create a Default Group"
-- runtime logic (see category-group.util.ts).

-- 1. Drop the old required FK before relaxing the column.
ALTER TABLE "Category" DROP CONSTRAINT "Category_category_group_id_fkey";
ALTER TABLE "Category" ALTER COLUMN "category_group_id" DROP NOT NULL;

-- 2. Free every category that only had a group because of the removed
--    auto-create-a-Default-Group logic — they become properly ungrouped,
--    matching the new optional-groups model. Real, user-created groups
--    (is_system_default = false) are untouched.
UPDATE "Category" c
SET "category_group_id" = NULL
FROM "CategoryGroup" g
WHERE c."category_group_id" = g."id" AND g."is_system_default" = true;

-- 3. Re-add the FK with ON DELETE SET NULL — deleting a group (soft or hard)
--    never blocks and never requires reassigning its categories anywhere.
ALTER TABLE "Category" ADD CONSTRAINT "Category_category_group_id_fkey"
  FOREIGN KEY ("category_group_id") REFERENCES "CategoryGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
