-- Add is_featured flag to Category, used to select which categories show
-- in the website Home page's "Featured Categories" section.
ALTER TABLE "Category" ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false;
