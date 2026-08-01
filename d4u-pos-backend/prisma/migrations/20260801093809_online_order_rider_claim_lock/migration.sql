-- Rider claim lock: additive, nullable columns on OnlineOrder so the first
-- rider to PATCH /rider-orders/:id/claim wins (conditional update WHERE
-- claimedByRiderId IS NULL) and every other rider gets a 409. No backfill
-- needed. Order.rider_id (pre-existing) is reused for POS-native delivery
-- orders instead of duplicating this column there.
--
-- Isolated by hand from `prisma migrate diff` output, which also included
-- unrelated pre-existing PurchaseOrder/Vendor/GoodsReceipt schema drift not
-- part of this change.

ALTER TABLE "OnlineOrder" ADD COLUMN "claimedByRiderId" INTEGER,
ADD COLUMN "claimedByRiderName" TEXT;
