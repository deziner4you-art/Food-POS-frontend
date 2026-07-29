-- Sprint 28.8A: Menu Builder Navigation Refinement.
-- Distinguishes user-created Category Groups from the system-generated
-- "Default Group" holding bucket (Sprint 28.7's getOrCreateDefaultCategoryGroupId),
-- so the navigation contract can exclude system-generated groups per spec
-- ("Category Groups are user-created entities only").
ALTER TABLE "CategoryGroup" ADD COLUMN "is_system_default" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: every existing row literally named "Default Group" was created
-- by that same fallback helper (verified — the name is hardcoded there and
-- never offered as a user-chosen name in any UI), so flag them retroactively.
UPDATE "CategoryGroup" SET "is_system_default" = true WHERE "name" = 'Default Group';
