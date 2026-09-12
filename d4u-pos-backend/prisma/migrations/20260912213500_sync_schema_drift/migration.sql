-- DropForeignKey
ALTER TABLE "CampaignAnalytics" DROP CONSTRAINT "CampaignAnalytics_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "OnlineOrder" DROP CONSTRAINT "OnlineOrder_kot_id_fkey";

-- DropForeignKey
ALTER TABLE "OnlineOrder" DROP CONSTRAINT "OnlineOrder_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OnlineOrder" DROP CONSTRAINT "OnlineOrder_store_id_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_category_id_fkey";

-- DropIndex
DROP INDEX "Category_category_group_id_idx";

-- DropIndex
DROP INDEX "OnlineOrder_kot_id_key";

-- DropIndex
DROP INDEX "OnlineOrder_orderId_key";

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'PKR',
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT,
ADD COLUMN     "deleted_reason" TEXT,
ADD COLUMN     "is_chain_store" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "menu_strategy" TEXT NOT NULL DEFAULT 'UNIFIED',
ADD COLUMN     "restored_at" TIMESTAMP(3),
ADD COLUMN     "restored_by" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "vat_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "CampaignAnalytics" DROP COLUMN "clicks",
DROP COLUMN "conversions",
DROP COLUMN "cost",
DROP COLUMN "createdAt",
DROP COLUMN "roi",
ADD COLUMN     "cart_adds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "discount_cost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "hour" INTEGER,
ADD COLUMN     "impressions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "menu_opens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "new_customers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "offer_clicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "orders_generated" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "product_clicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "profit_impact" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "returning_customers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "store_id" INTEGER;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "CmsSettings" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "max_stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reorder_level" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "unit_price" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "is_posted_to_ledger" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OnlineOrder" DROP COLUMN "kot_id",
ADD COLUMN     "posOrderId" INTEGER;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "business_day_id" INTEGER,
ADD COLUMN     "customer_feedback" TEXT,
ADD COLUMN     "delivery_address" TEXT,
ADD COLUMN     "delivery_info" JSONB,
ADD COLUMN     "order_source" TEXT NOT NULL DEFAULT 'WALKIN',
ADD COLUMN     "payment_method" TEXT NOT NULL DEFAULT 'CASH',
ADD COLUMN     "payment_status" TEXT NOT NULL DEFAULT 'PAID',
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "rider_id" INTEGER,
ADD COLUMN     "table_no" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "variant_id" INTEGER;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "category_id",
ADD COLUMN     "availability_rule_id" INTEGER,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "kds_group" TEXT,
ADD COLUMN     "kitchen_station" TEXT,
ADD COLUMN     "printer_group" TEXT,
ADD COLUMN     "recipe_id" INTEGER,
ADD COLUMN     "tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "address" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT,
ADD COLUMN     "deleted_reason" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "landline" TEXT,
ADD COLUMN     "map_pin" TEXT,
ADD COLUMN     "order_no_prefix" TEXT,
ADD COLUMN     "owner_email" TEXT,
ADD COLUMN     "owner_name" TEXT,
ADD COLUMN     "owner_phone" TEXT,
ADD COLUMN     "restored_at" TIMESTAMP(3),
ADD COLUMN     "restored_by" TEXT,
ADD COLUMN     "resume_at" TIMESTAMP(3),
ADD COLUMN     "saas_package_id" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "status_changed_at" TIMESTAMP(3),
ADD COLUMN     "status_changed_by" TEXT,
ADD COLUMN     "status_reason" TEXT,
ADD COLUMN     "vat_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "whatsapp" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "designation" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "emp_id" TEXT,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "joining_date" TIMESTAMP(3),
ADD COLUMN     "module_permissions" JSONB,
ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "password_changed_at" TIMESTAMP(3),
ADD COLUMN     "password_reset_at" TIMESTAMP(3),
ADD COLUMN     "password_reset_by" INTEGER,
ADD COLUMN     "refreshTokenHash" TEXT,
ADD COLUMN     "rider_details" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Voucher" DROP COLUMN "notes",
ADD COLUMN     "accounting_period_id" INTEGER NOT NULL,
ADD COLUMN     "currency_id" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "fiscal_year_id" INTEGER NOT NULL,
ADD COLUMN     "journal_entry_id" INTEGER,
ADD COLUMN     "journal_id" INTEGER NOT NULL,
ADD COLUMN     "reference_number" TEXT;

-- CreateTable
CREATE TABLE "SystemAuditLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" INTEGER,
    "user_id" INTEGER,
    "user_name" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionGroup" (
    "id" SERIAL NOT NULL,
    "module_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "PermissionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleInheritance" (
    "id" SERIAL NOT NULL,
    "parent_role_id" INTEGER NOT NULL,
    "child_role_id" INTEGER NOT NULL,

    CONSTRAINT "RoleInheritance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAssignment" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "brand_id" INTEGER,
    "store_id" INTEGER,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "reporting_manager_id" INTEGER,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "monthly_rental" DOUBLE PRECISION NOT NULL,
    "billing_cycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "discount_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_value" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageModule" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "module_key" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "config" JSONB,

    CONSTRAINT "PackageModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,
    "rental_amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "billing_cycle" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "next_billing_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "grace_period_days" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "suspend_reason" TEXT,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" SERIAL NOT NULL,
    "subscription_id" INTEGER NOT NULL,
    "amount_paid" DOUBLE PRECISION NOT NULL,
    "payment_method" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" INTEGER NOT NULL,
    "reference_number" TEXT,
    "remarks" TEXT,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingHistory" (
    "id" SERIAL NOT NULL,
    "subscription_id" INTEGER NOT NULL,
    "event_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaaSPricing" (
    "id" SERIAL NOT NULL,
    "module_key" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "price_monthly" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',

    CONSTRAINT "SaaSPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION DEFAULT 0,
    "sku" TEXT,
    "barcode" TEXT,
    "recipe_id" INTEGER,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ALWAYS',
    "start_time" TEXT,
    "end_time" TEXT,
    "days" TEXT,

    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModifierGroup" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "min_selection" INTEGER NOT NULL DEFAULT 0,
    "max_selection" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ModifierGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modifier" (
    "id" SERIAL NOT NULL,
    "modifier_group_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "additional_price" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Modifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductModifierGroup" (
    "product_id" INTEGER NOT NULL,
    "modifier_group_id" INTEGER NOT NULL,

    CONSTRAINT "ProductModifierGroup_pkey" PRIMARY KEY ("product_id","modifier_group_id")
);

-- CreateTable
CREATE TABLE "RecipeCategory" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "category_id" INTEGER,
    "name" TEXT NOT NULL,
    "yield" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "portion_size" DOUBLE PRECISION,
    "waste_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prep_time_mins" INTEGER NOT NULL DEFAULT 0,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "inventory_id" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashFlow" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "business_day_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "contact_person" TEXT,
    "address" TEXT,
    "tax_number" TEXT,
    "payment_terms" TEXT,
    "credit_limit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "ledger_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "po_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "payment_status" TEXT NOT NULL DEFAULT 'UNPAID',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shipping_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "other_charges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grand_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_by" INTEGER NOT NULL DEFAULT 1,
    "approved_by" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" SERIAL NOT NULL,
    "po_id" INTEGER NOT NULL,
    "inventory_id" INTEGER NOT NULL,
    "ordered_qty" DOUBLE PRECISION NOT NULL,
    "received_qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remaining_qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price_unit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "line_total" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "po_id" INTEGER NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "invoice_number" TEXT,
    "received_by" INTEGER NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "attachments" TEXT,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptItem" (
    "id" SERIAL NOT NULL,
    "grn_id" INTEGER NOT NULL,
    "po_item_id" INTEGER NOT NULL,
    "inventory_id" INTEGER NOT NULL,
    "received_qty" DOUBLE PRECISION NOT NULL,
    "rejected_qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "damaged_qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit_cost" DOUBLE PRECISION NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "batch_number" TEXT,

    CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorLedgerEntry" (
    "id" SERIAL NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reference" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance_after" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransitLoss" (
    "id" SERIAL NOT NULL,
    "po_item_id" INTEGER NOT NULL,
    "inventory_id" INTEGER NOT NULL,
    "lost_qty" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransitLoss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchSocialAccount" (
    "id" TEXT NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "facebook_page_id" TEXT,
    "facebook_page_name" TEXT,
    "instagram_user_id" TEXT,
    "instagram_username" TEXT,
    "access_token" TEXT,
    "is_facebook_connected" BOOLEAN NOT NULL DEFAULT false,
    "is_instagram_connected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BranchSocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledDiscount" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "discount_pct" DOUBLE PRECISION NOT NULL,
    "image_url" TEXT,
    "target_category_id" INTEGER,
    "target_product_id" INTEGER,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "target_stores" TEXT NOT NULL DEFAULT 'ALL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostingRule" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "rule_code" TEXT NOT NULL,
    "rule_name" TEXT NOT NULL,
    "trigger_event" TEXT NOT NULL,
    "debit_account_resolver" TEXT NOT NULL,
    "credit_account_resolver" TEXT NOT NULL,
    "currency_strategy" TEXT NOT NULL,
    "tax_strategy" TEXT NOT NULL,
    "cost_center_strategy" TEXT,
    "profit_center_strategy" TEXT,
    "auto_post" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "PostingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER,
    "product_id" INTEGER NOT NULL,
    "batch_number" TEXT,
    "movement_type" TEXT NOT NULL,
    "reference_module" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "quantity_in" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity_out" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance_after" DOUBLE PRECISION NOT NULL,
    "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valuation_method" TEXT,
    "created_by" INTEGER NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockCountSession" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_by" INTEGER NOT NULL,
    "approved_by" INTEGER,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockCountSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockCountLine" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "system_quantity" DOUBLE PRECISION NOT NULL,
    "physical_quantity" DOUBLE PRECISION,
    "variance" DOUBLE PRECISION,
    "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT,

    CONSTRAINT "StockCountLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteSession" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER,
    "reference_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_by" INTEGER NOT NULL,
    "approved_by" INTEGER,
    "remarks" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WasteSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteLine" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "batch_number" TEXT,
    "waste_reason" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "remarks" TEXT,

    CONSTRAINT "WasteLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryBatch" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER,
    "product_id" INTEGER NOT NULL,
    "batch_number" TEXT NOT NULL,
    "lot_number" TEXT,
    "manufacturing_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "received_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "available_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reserved_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consumed_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waste_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valuation_method" TEXT DEFAULT 'WEIGHTED_AVERAGE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchMovement" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "movement_type" TEXT NOT NULL,
    "reference_module" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "quantity_in" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity_out" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_by" INTEGER NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchReservation" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "reference_module" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseTransfer" (
    "id" SERIAL NOT NULL,
    "transfer_number" TEXT NOT NULL,
    "source_store_id" INTEGER NOT NULL,
    "source_warehouse_id" INTEGER,
    "dest_store_id" INTEGER NOT NULL,
    "dest_warehouse_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_by" INTEGER NOT NULL,
    "approved_by" INTEGER,
    "transfer_date" TIMESTAMP(3),
    "received_date" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseTransferLine" (
    "id" SERIAL NOT NULL,
    "transfer_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "batch_id" INTEGER,
    "requested_quantity" DOUBLE PRECISION NOT NULL,
    "transferred_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "received_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT,

    CONSTRAINT "WarehouseTransferLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferApproval" (
    "id" SERIAL NOT NULL,
    "transfer_id" INTEGER NOT NULL,
    "approver_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "remarks" TEXT,
    "approved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryReservation" (
    "id" SERIAL NOT NULL,
    "reservation_number" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "reference_module" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "store_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "reservation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" TIMESTAMP(3),
    "remarks" TEXT,
    "created_by" INTEGER NOT NULL,
    "approved_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryReservationLine" (
    "id" SERIAL NOT NULL,
    "reservation_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "reserved_quantity" DOUBLE PRECISION NOT NULL,
    "consumed_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "released_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "available_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "InventoryReservationLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationAllocation" (
    "id" SERIAL NOT NULL,
    "line_id" INTEGER NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionOrder" (
    "id" SERIAL NOT NULL,
    "production_number" TEXT NOT NULL,
    "production_type" TEXT NOT NULL,
    "target_product_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER,
    "kitchen_id" INTEGER,
    "planned_quantity" DOUBLE PRECISION NOT NULL,
    "produced_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rejected_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scrap_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "batch_number" TEXT,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "supervisor_id" INTEGER,
    "remarks" TEXT,
    "reservation_id" INTEGER,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionOrderLine" (
    "id" SERIAL NOT NULL,
    "production_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "planned_quantity" DOUBLE PRECISION NOT NULL,
    "consumed_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ProductionOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionOutput" (
    "id" SERIAL NOT NULL,
    "production_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "batch_id" INTEGER,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionConsumption" (
    "id" SERIAL NOT NULL,
    "production_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "batch_id" INTEGER,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionStage" (
    "id" SERIAL NOT NULL,
    "production_id" INTEGER NOT NULL,
    "stage_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionCost" (
    "id" SERIAL NOT NULL,
    "production_id" INTEGER NOT NULL,
    "planned_material_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actual_material_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "planned_labor_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actual_labor_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "planned_overhead_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actual_overhead_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_planned_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_actual_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionVariance" (
    "id" SERIAL NOT NULL,
    "production_id" INTEGER NOT NULL,
    "material_cost_variance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity_variance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "yield_variance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waste_variance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_variance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "variance_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "efficiency_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionVariance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionYield" (
    "id" SERIAL NOT NULL,
    "production_id" INTEGER NOT NULL,
    "planned_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actual_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expected_yield" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actual_yield" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "yield_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loss_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scrap_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "material_usage_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionYield_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodClosing" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "fiscal_year_id" INTEGER NOT NULL,
    "accounting_period_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "opened_by" INTEGER,
    "closed_by" INTEGER,
    "closed_at" TIMESTAMP(3),
    "reopened_by" INTEGER,
    "reason" TEXT,
    "checklist_status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodClosing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClosingChecklist" (
    "id" SERIAL NOT NULL,
    "closing_id" INTEGER NOT NULL,
    "module" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "validation_message" TEXT,
    "validated_at" TIMESTAMP(3),
    "validated_by" INTEGER,

    CONSTRAINT "ClosingChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClosingLog" (
    "id" SERIAL NOT NULL,
    "closing_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "old_status" TEXT,
    "new_status" TEXT,
    "reason" TEXT,
    "performed_by" INTEGER NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClosingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialStatement" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialStatementSection" (
    "id" SERIAL NOT NULL,
    "statement_id" INTEGER NOT NULL,
    "parent_section_id" INTEGER,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialStatementSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialStatementMapping" (
    "id" SERIAL NOT NULL,
    "section_id" INTEGER NOT NULL,
    "account_id" INTEGER,
    "account_group_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialStatementMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "fiscal_year_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetVersion" (
    "id" SERIAL NOT NULL,
    "budget_id" INTEGER NOT NULL,
    "version_number" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,

    CONSTRAINT "BudgetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" SERIAL NOT NULL,
    "budget_version_id" INTEGER NOT NULL,
    "account_id" INTEGER,
    "account_group_id" INTEGER,
    "amount" DECIMAL(15,4) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthEndClosing" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "accounting_period_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "executed_by" INTEGER,

    CONSTRAINT "MonthEndClosing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClosingTask" (
    "id" SERIAL NOT NULL,
    "month_end_closing_id" INTEGER NOT NULL,
    "task_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "executed_at" TIMESTAMP(3),

    CONSTRAINT "ClosingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClosingException" (
    "id" SERIAL NOT NULL,
    "month_end_closing_id" INTEGER NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClosingException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YearEndClosing" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "fiscal_year_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "executed_by" INTEGER,

    CONSTRAINT "YearEndClosing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YearEndClosingLog" (
    "id" SERIAL NOT NULL,
    "year_end_closing_id" INTEGER NOT NULL,
    "task_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "executed_at" TIMESTAMP(3),

    CONSTRAINT "YearEndClosingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetainedEarningsTransfer" (
    "id" SERIAL NOT NULL,
    "year_end_closing_id" INTEGER NOT NULL,
    "source_account_id" INTEGER,
    "source_group_id" INTEGER,
    "retained_earnings_account_id" INTEGER NOT NULL,
    "amount" DECIMAL(15,4) NOT NULL,
    "transfer_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetainedEarningsTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedAssetCategory" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "useful_life_years" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixedAssetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetLocation" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedAsset" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "location_id" INTEGER,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purchase_date" TIMESTAMP(3) NOT NULL,
    "purchase_cost" DECIMAL(15,4) NOT NULL,
    "capitalization_date" TIMESTAMP(3),
    "residual_value" DECIMAL(15,4) NOT NULL,
    "useful_life" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "department" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,

    CONSTRAINT "FixedAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetTransfer" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "from_location_id" INTEGER,
    "to_location_id" INTEGER NOT NULL,
    "transfer_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "executed_by" INTEGER NOT NULL,

    CONSTRAINT "AssetTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetDisposal" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "disposal_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disposal_type" TEXT NOT NULL,
    "sale_value" DECIMAL(15,4),
    "reason" TEXT,
    "executed_by" INTEGER NOT NULL,

    CONSTRAINT "AssetDisposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetDepreciation" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "rate" DECIMAL(15,4),
    "accumulated_amount" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "book_value" DECIMAL(15,4) NOT NULL,
    "last_depreciation_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetDepreciation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepreciationSchedule" (
    "id" SERIAL NOT NULL,
    "asset_depreciation_id" INTEGER NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,4) NOT NULL,
    "is_posted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepreciationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepreciationPosting" (
    "id" SERIAL NOT NULL,
    "asset_depreciation_id" INTEGER NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "journal_entry_id" INTEGER NOT NULL,
    "posting_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(15,4) NOT NULL,
    "executed_by" INTEGER NOT NULL,

    CONSTRAINT "DepreciationPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerReceivable" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "total_amount" DECIMAL(15,4) NOT NULL,
    "paid_amount" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "outstanding_balance" DECIMAL(15,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "journal_entry_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerReceivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerReceipt" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "receivable_id" INTEGER NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "receipt_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(15,4) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "reference_number" TEXT,
    "journal_entry_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerCreditLimit" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "credit_limit" DECIMAL(15,4) NOT NULL,
    "available_credit" DECIMAL(15,4) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerCreditLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAging" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "current" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "days_1_30" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "days_31_60" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "days_61_90" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "days_91_120" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "days_over_120" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "total_outstanding" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerAging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPayable" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "purchase_invoice_id" TEXT NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "total_amount" DECIMAL(15,4) NOT NULL,
    "paid_amount" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "outstanding_balance" DECIMAL(15,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "journal_entry_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPayable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPayment" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "payable_id" INTEGER NOT NULL,
    "payment_number" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(15,4) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "reference_number" TEXT,
    "journal_entry_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorCreditTerms" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "credit_limit" DECIMAL(15,4) NOT NULL,
    "available_credit" DECIMAL(15,4) NOT NULL,
    "payment_terms_days" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorCreditTerms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorAging" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "current" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "days_1_30" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "days_31_60" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "days_61_90" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "days_91_120" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "days_over_120" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "total_outstanding" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorAging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankStatement" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "statement_date" TIMESTAMP(3) NOT NULL,
    "opening_balance" DECIMAL(15,4) NOT NULL,
    "closing_balance" DECIMAL(15,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankStatementLine" (
    "id" SERIAL NOT NULL,
    "statement_id" INTEGER NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "reference_number" TEXT,
    "amount" DECIMAL(15,4) NOT NULL,
    "is_reconciled" BOOLEAN NOT NULL DEFAULT false,
    "matched_journal_line_id" INTEGER,

    CONSTRAINT "BankStatementLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankReconciliation" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "statement_id" INTEGER NOT NULL,
    "reconciliation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "matched_amount" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "unmatched_amount" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "executed_by" INTEGER NOT NULL,

    CONSTRAINT "BankReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankReconciliationAdjustment" (
    "id" SERIAL NOT NULL,
    "reconciliation_id" INTEGER NOT NULL,
    "journal_entry_id" INTEGER NOT NULL,
    "amount" DECIMAL(15,4) NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankReconciliationAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "current_balance" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashTransaction" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "bank_account_id" INTEGER NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transaction_type" TEXT NOT NULL,
    "amount" DECIMAL(15,4) NOT NULL,
    "description" TEXT NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "journal_entry_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankTransfer" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "source_account_id" INTEGER NOT NULL,
    "destination_account_id" INTEGER NOT NULL,
    "transfer_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(15,4) NOT NULL,
    "reference_number" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "journal_entry_id" INTEGER,
    "created_by" INTEGER NOT NULL,

    CONSTRAINT "BankTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashForecast" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "forecast_date" TIMESTAMP(3) NOT NULL,
    "expected_inflows" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "expected_outflows" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "net_forecast" DECIMAL(15,4) NOT NULL DEFAULT 0.0,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashPosition" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "bank_account_id" INTEGER NOT NULL,
    "position_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opening_balance" DECIMAL(15,4) NOT NULL,
    "net_change" DECIMAL(15,4) NOT NULL,
    "closing_balance" DECIMAL(15,4) NOT NULL,

    CONSTRAINT "CashPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceCheck" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "check_name" TEXT NOT NULL,
    "check_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalControl" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "control_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "last_verified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditFinding" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "finding_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reference_id" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoLiveChecklist" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "module_name" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),

    CONSTRAINT "GoLiveChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemCertification" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "certification_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accounting_score" DECIMAL(5,2) NOT NULL,
    "module_health_score" DECIMAL(5,2) NOT NULL,
    "data_integrity_score" DECIMAL(5,2) NOT NULL,
    "security_score" DECIMAL(5,2) NOT NULL,
    "performance_score" DECIMAL(5,2) NOT NULL,
    "overall_status" TEXT NOT NULL,
    "certified_by" INTEGER NOT NULL,

    CONSTRAINT "SystemCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEventLog" (
    "id" SERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "storeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryStores" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_ProductCategories" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_ProductStores" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_hash_key" ON "RefreshToken"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionGroup_module_name_key" ON "PermissionGroup"("module_name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_group_id_resource_action_key" ON "Permission"("group_id", "resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_id_permission_id_key" ON "RolePermission"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "RoleInheritance_parent_role_id_child_role_id_key" ON "RoleInheritance"("parent_role_id", "child_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "Package_code_key" ON "Package"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_brand_id_key" ON "Subscription"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "SaaSPricing_module_key_currency_key" ON "SaaSPricing"("module_key", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_po_number_key" ON "PurchaseOrder"("po_number");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_receipt_number_key" ON "GoodsReceipt"("receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "BranchSocialAccount_branch_id_key" ON "BranchSocialAccount"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_store_id_email_key" ON "NewsletterSubscriber"("store_id", "email");

-- CreateIndex
CREATE INDEX "PostingRule_store_id_idx" ON "PostingRule"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "PostingRule_store_id_rule_code_key" ON "PostingRule"("store_id", "rule_code");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryBatch_store_id_warehouse_id_product_id_batch_numbe_key" ON "InventoryBatch"("store_id", "warehouse_id", "product_id", "batch_number");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseTransfer_transfer_number_key" ON "WarehouseTransfer"("transfer_number");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryReservation_reservation_number_key" ON "InventoryReservation"("reservation_number");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrder_production_number_key" ON "ProductionOrder"("production_number");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionCost_production_id_key" ON "ProductionCost"("production_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionVariance_production_id_key" ON "ProductionVariance"("production_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionYield_production_id_key" ON "ProductionYield"("production_id");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodClosing_accounting_period_id_key" ON "PeriodClosing"("accounting_period_id");

-- CreateIndex
CREATE INDEX "FinancialStatement_store_id_idx" ON "FinancialStatement"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialStatement_store_id_name_key" ON "FinancialStatement"("store_id", "name");

-- CreateIndex
CREATE INDEX "FinancialStatementSection_statement_id_idx" ON "FinancialStatementSection"("statement_id");

-- CreateIndex
CREATE INDEX "FinancialStatementSection_parent_section_id_idx" ON "FinancialStatementSection"("parent_section_id");

-- CreateIndex
CREATE INDEX "FinancialStatementMapping_section_id_idx" ON "FinancialStatementMapping"("section_id");

-- CreateIndex
CREATE INDEX "FinancialStatementMapping_account_id_idx" ON "FinancialStatementMapping"("account_id");

-- CreateIndex
CREATE INDEX "FinancialStatementMapping_account_group_id_idx" ON "FinancialStatementMapping"("account_group_id");

-- CreateIndex
CREATE INDEX "Budget_store_id_idx" ON "Budget"("store_id");

-- CreateIndex
CREATE INDEX "Budget_fiscal_year_id_idx" ON "Budget"("fiscal_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetVersion_budget_id_version_number_key" ON "BudgetVersion"("budget_id", "version_number");

-- CreateIndex
CREATE INDEX "BudgetLine_budget_version_id_idx" ON "BudgetLine"("budget_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "MonthEndClosing_accounting_period_id_key" ON "MonthEndClosing"("accounting_period_id");

-- CreateIndex
CREATE INDEX "MonthEndClosing_store_id_idx" ON "MonthEndClosing"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "YearEndClosing_fiscal_year_id_key" ON "YearEndClosing"("fiscal_year_id");

-- CreateIndex
CREATE INDEX "YearEndClosing_store_id_idx" ON "YearEndClosing"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "FixedAssetCategory_code_key" ON "FixedAssetCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AssetLocation_store_id_code_key" ON "AssetLocation"("store_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "FixedAsset_code_key" ON "FixedAsset"("code");

-- CreateIndex
CREATE INDEX "FixedAsset_store_id_idx" ON "FixedAsset"("store_id");

-- CreateIndex
CREATE INDEX "FixedAsset_category_id_idx" ON "FixedAsset"("category_id");

-- CreateIndex
CREATE INDEX "AssetTransfer_asset_id_idx" ON "AssetTransfer"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "AssetDisposal_asset_id_key" ON "AssetDisposal"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "AssetDepreciation_asset_id_key" ON "AssetDepreciation"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "DepreciationPosting_schedule_id_key" ON "DepreciationPosting"("schedule_id");

-- CreateIndex
CREATE UNIQUE INDEX "DepreciationPosting_journal_entry_id_key" ON "DepreciationPosting"("journal_entry_id");

-- CreateIndex
CREATE INDEX "CustomerReceivable_store_id_idx" ON "CustomerReceivable"("store_id");

-- CreateIndex
CREATE INDEX "CustomerReceivable_customer_id_idx" ON "CustomerReceivable"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerReceipt_receipt_number_key" ON "CustomerReceipt"("receipt_number");

-- CreateIndex
CREATE INDEX "CustomerReceipt_store_id_idx" ON "CustomerReceipt"("store_id");

-- CreateIndex
CREATE INDEX "CustomerReceipt_receivable_id_idx" ON "CustomerReceipt"("receivable_id");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerCreditLimit_store_id_customer_id_key" ON "CustomerCreditLimit"("store_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAging_store_id_customer_id_key" ON "CustomerAging"("store_id", "customer_id");

-- CreateIndex
CREATE INDEX "VendorPayable_store_id_idx" ON "VendorPayable"("store_id");

-- CreateIndex
CREATE INDEX "VendorPayable_vendor_id_idx" ON "VendorPayable"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPayment_payment_number_key" ON "VendorPayment"("payment_number");

-- CreateIndex
CREATE INDEX "VendorPayment_store_id_idx" ON "VendorPayment"("store_id");

-- CreateIndex
CREATE INDEX "VendorPayment_payable_id_idx" ON "VendorPayment"("payable_id");

-- CreateIndex
CREATE UNIQUE INDEX "VendorCreditTerms_store_id_vendor_id_key" ON "VendorCreditTerms"("store_id", "vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "VendorAging_store_id_vendor_id_key" ON "VendorAging"("store_id", "vendor_id");

-- CreateIndex
CREATE INDEX "BankStatement_store_id_idx" ON "BankStatement"("store_id");

-- CreateIndex
CREATE INDEX "BankStatement_account_id_idx" ON "BankStatement"("account_id");

-- CreateIndex
CREATE INDEX "BankStatementLine_statement_id_idx" ON "BankStatementLine"("statement_id");

-- CreateIndex
CREATE INDEX "BankStatementLine_matched_journal_line_id_idx" ON "BankStatementLine"("matched_journal_line_id");

-- CreateIndex
CREATE UNIQUE INDEX "BankReconciliation_statement_id_key" ON "BankReconciliation"("statement_id");

-- CreateIndex
CREATE INDEX "BankReconciliation_store_id_idx" ON "BankReconciliation"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "BankReconciliationAdjustment_journal_entry_id_key" ON "BankReconciliationAdjustment"("journal_entry_id");

-- CreateIndex
CREATE INDEX "BankReconciliationAdjustment_reconciliation_id_idx" ON "BankReconciliationAdjustment"("reconciliation_id");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_account_id_key" ON "BankAccount"("account_id");

-- CreateIndex
CREATE INDEX "BankAccount_store_id_idx" ON "BankAccount"("store_id");

-- CreateIndex
CREATE INDEX "CashTransaction_store_id_idx" ON "CashTransaction"("store_id");

-- CreateIndex
CREATE INDEX "CashTransaction_bank_account_id_idx" ON "CashTransaction"("bank_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransfer_reference_number_key" ON "BankTransfer"("reference_number");

-- CreateIndex
CREATE INDEX "BankTransfer_store_id_idx" ON "BankTransfer"("store_id");

-- CreateIndex
CREATE INDEX "CashForecast_store_id_idx" ON "CashForecast"("store_id");

-- CreateIndex
CREATE INDEX "CashPosition_store_id_idx" ON "CashPosition"("store_id");

-- CreateIndex
CREATE INDEX "CashPosition_bank_account_id_idx" ON "CashPosition"("bank_account_id");

-- CreateIndex
CREATE INDEX "ComplianceCheck_store_id_idx" ON "ComplianceCheck"("store_id");

-- CreateIndex
CREATE INDEX "InternalControl_store_id_idx" ON "InternalControl"("store_id");

-- CreateIndex
CREATE INDEX "AuditFinding_store_id_idx" ON "AuditFinding"("store_id");

-- CreateIndex
CREATE INDEX "GoLiveChecklist_store_id_idx" ON "GoLiveChecklist"("store_id");

-- CreateIndex
CREATE INDEX "SystemCertification_store_id_idx" ON "SystemCertification"("store_id");

-- CreateIndex
CREATE INDEX "OrderEventLog_orderId_idx" ON "OrderEventLog"("orderId");

-- CreateIndex
CREATE INDEX "OrderEventLog_storeId_idx" ON "OrderEventLog"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryStores_AB_unique" ON "_CategoryStores"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryStores_B_index" ON "_CategoryStores"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductCategories_AB_unique" ON "_ProductCategories"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductCategories_B_index" ON "_ProductCategories"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductStores_AB_unique" ON "_ProductStores"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductStores_B_index" ON "_ProductStores"("B");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignAnalytics_campaign_id_date_hour_store_id_key" ON "CampaignAnalytics"("campaign_id", "date", "hour", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "OnlineOrder_posOrderId_key" ON "OnlineOrder"("posOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_journal_entry_id_key" ON "Voucher"("journal_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_store_id_voucher_number_key" ON "Voucher"("store_id", "voucher_number");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_saas_package_id_fkey" FOREIGN KEY ("saas_package_id") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "PermissionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleInheritance" ADD CONSTRAINT "RoleInheritance_parent_role_id_fkey" FOREIGN KEY ("parent_role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleInheritance" ADD CONSTRAINT "RoleInheritance_child_role_id_fkey" FOREIGN KEY ("child_role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAssignment" ADD CONSTRAINT "UserAssignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAssignment" ADD CONSTRAINT "UserAssignment_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAssignment" ADD CONSTRAINT "UserAssignment_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAssignment" ADD CONSTRAINT "UserAssignment_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAssignment" ADD CONSTRAINT "UserAssignment_reporting_manager_id_fkey" FOREIGN KEY ("reporting_manager_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageModule" ADD CONSTRAINT "PackageModule_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingHistory" ADD CONSTRAINT "BillingHistory_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_availability_rule_id_fkey" FOREIGN KEY ("availability_rule_id") REFERENCES "AvailabilityRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModifierGroup" ADD CONSTRAINT "ModifierGroup_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modifier" ADD CONSTRAINT "Modifier_modifier_group_id_fkey" FOREIGN KEY ("modifier_group_id") REFERENCES "ModifierGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductModifierGroup" ADD CONSTRAINT "ProductModifierGroup_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductModifierGroup" ADD CONSTRAINT "ProductModifierGroup_modifier_group_id_fkey" FOREIGN KEY ("modifier_group_id") REFERENCES "ModifierGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeCategory" ADD CONSTRAINT "RecipeCategory_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "RecipeCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_business_day_id_fkey" FOREIGN KEY ("business_day_id") REFERENCES "BusinessDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_business_day_id_fkey" FOREIGN KEY ("business_day_id") REFERENCES "BusinessDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlineOrder" ADD CONSTRAINT "OnlineOrder_posOrderId_fkey" FOREIGN KEY ("posOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_grn_id_fkey" FOREIGN KEY ("grn_id") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_po_item_id_fkey" FOREIGN KEY ("po_item_id") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorLedgerEntry" ADD CONSTRAINT "VendorLedgerEntry_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitLoss" ADD CONSTRAINT "TransitLoss_po_item_id_fkey" FOREIGN KEY ("po_item_id") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitLoss" ADD CONSTRAINT "TransitLoss_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAnalytics" ADD CONSTRAINT "CampaignAnalytics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchSocialAccount" ADD CONSTRAINT "BranchSocialAccount_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledDiscount" ADD CONSTRAINT "ScheduledDiscount_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_fiscal_year_id_fkey" FOREIGN KEY ("fiscal_year_id") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_accounting_period_id_fkey" FOREIGN KEY ("accounting_period_id") REFERENCES "AccountingPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "Journal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingRule" ADD CONSTRAINT "PostingRule_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCountSession" ADD CONSTRAINT "StockCountSession_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCountLine" ADD CONSTRAINT "StockCountLine_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "StockCountSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCountLine" ADD CONSTRAINT "StockCountLine_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteSession" ADD CONSTRAINT "WasteSession_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteLine" ADD CONSTRAINT "WasteLine_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "WasteSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteLine" ADD CONSTRAINT "WasteLine_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBatch" ADD CONSTRAINT "InventoryBatch_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBatch" ADD CONSTRAINT "InventoryBatch_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchMovement" ADD CONSTRAINT "BatchMovement_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "InventoryBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchReservation" ADD CONSTRAINT "BatchReservation_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "InventoryBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTransfer" ADD CONSTRAINT "WarehouseTransfer_source_store_id_fkey" FOREIGN KEY ("source_store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTransfer" ADD CONSTRAINT "WarehouseTransfer_dest_store_id_fkey" FOREIGN KEY ("dest_store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTransferLine" ADD CONSTRAINT "WarehouseTransferLine_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "WarehouseTransfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTransferLine" ADD CONSTRAINT "WarehouseTransferLine_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTransferLine" ADD CONSTRAINT "WarehouseTransferLine_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "InventoryBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferApproval" ADD CONSTRAINT "TransferApproval_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "WarehouseTransfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservationLine" ADD CONSTRAINT "InventoryReservationLine_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "InventoryReservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservationLine" ADD CONSTRAINT "InventoryReservationLine_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationAllocation" ADD CONSTRAINT "ReservationAllocation_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "InventoryReservationLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationAllocation" ADD CONSTRAINT "ReservationAllocation_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "InventoryBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_target_product_id_fkey" FOREIGN KEY ("target_product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrderLine" ADD CONSTRAINT "ProductionOrderLine_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrderLine" ADD CONSTRAINT "ProductionOrderLine_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOutput" ADD CONSTRAINT "ProductionOutput_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOutput" ADD CONSTRAINT "ProductionOutput_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOutput" ADD CONSTRAINT "ProductionOutput_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "InventoryBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionConsumption" ADD CONSTRAINT "ProductionConsumption_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionConsumption" ADD CONSTRAINT "ProductionConsumption_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionConsumption" ADD CONSTRAINT "ProductionConsumption_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "InventoryBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionStage" ADD CONSTRAINT "ProductionStage_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionCost" ADD CONSTRAINT "ProductionCost_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionVariance" ADD CONSTRAINT "ProductionVariance_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionYield" ADD CONSTRAINT "ProductionYield_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodClosing" ADD CONSTRAINT "PeriodClosing_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodClosing" ADD CONSTRAINT "PeriodClosing_fiscal_year_id_fkey" FOREIGN KEY ("fiscal_year_id") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodClosing" ADD CONSTRAINT "PeriodClosing_accounting_period_id_fkey" FOREIGN KEY ("accounting_period_id") REFERENCES "AccountingPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClosingChecklist" ADD CONSTRAINT "ClosingChecklist_closing_id_fkey" FOREIGN KEY ("closing_id") REFERENCES "PeriodClosing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClosingLog" ADD CONSTRAINT "ClosingLog_closing_id_fkey" FOREIGN KEY ("closing_id") REFERENCES "PeriodClosing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialStatement" ADD CONSTRAINT "FinancialStatement_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialStatementSection" ADD CONSTRAINT "FinancialStatementSection_statement_id_fkey" FOREIGN KEY ("statement_id") REFERENCES "FinancialStatement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialStatementSection" ADD CONSTRAINT "FinancialStatementSection_parent_section_id_fkey" FOREIGN KEY ("parent_section_id") REFERENCES "FinancialStatementSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialStatementMapping" ADD CONSTRAINT "FinancialStatementMapping_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "FinancialStatementSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialStatementMapping" ADD CONSTRAINT "FinancialStatementMapping_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialStatementMapping" ADD CONSTRAINT "FinancialStatementMapping_account_group_id_fkey" FOREIGN KEY ("account_group_id") REFERENCES "AccountGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_fiscal_year_id_fkey" FOREIGN KEY ("fiscal_year_id") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetVersion" ADD CONSTRAINT "BudgetVersion_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_budget_version_id_fkey" FOREIGN KEY ("budget_version_id") REFERENCES "BudgetVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_account_group_id_fkey" FOREIGN KEY ("account_group_id") REFERENCES "AccountGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthEndClosing" ADD CONSTRAINT "MonthEndClosing_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthEndClosing" ADD CONSTRAINT "MonthEndClosing_accounting_period_id_fkey" FOREIGN KEY ("accounting_period_id") REFERENCES "AccountingPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClosingTask" ADD CONSTRAINT "ClosingTask_month_end_closing_id_fkey" FOREIGN KEY ("month_end_closing_id") REFERENCES "MonthEndClosing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClosingException" ADD CONSTRAINT "ClosingException_month_end_closing_id_fkey" FOREIGN KEY ("month_end_closing_id") REFERENCES "MonthEndClosing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YearEndClosing" ADD CONSTRAINT "YearEndClosing_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YearEndClosing" ADD CONSTRAINT "YearEndClosing_fiscal_year_id_fkey" FOREIGN KEY ("fiscal_year_id") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YearEndClosingLog" ADD CONSTRAINT "YearEndClosingLog_year_end_closing_id_fkey" FOREIGN KEY ("year_end_closing_id") REFERENCES "YearEndClosing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetainedEarningsTransfer" ADD CONSTRAINT "RetainedEarningsTransfer_year_end_closing_id_fkey" FOREIGN KEY ("year_end_closing_id") REFERENCES "YearEndClosing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetainedEarningsTransfer" ADD CONSTRAINT "RetainedEarningsTransfer_source_account_id_fkey" FOREIGN KEY ("source_account_id") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetainedEarningsTransfer" ADD CONSTRAINT "RetainedEarningsTransfer_retained_earnings_account_id_fkey" FOREIGN KEY ("retained_earnings_account_id") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetainedEarningsTransfer" ADD CONSTRAINT "RetainedEarningsTransfer_source_group_id_fkey" FOREIGN KEY ("source_group_id") REFERENCES "AccountGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetLocation" ADD CONSTRAINT "AssetLocation_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedAsset" ADD CONSTRAINT "FixedAsset_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedAsset" ADD CONSTRAINT "FixedAsset_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "FixedAssetCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedAsset" ADD CONSTRAINT "FixedAsset_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "AssetLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTransfer" ADD CONSTRAINT "AssetTransfer_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "FixedAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTransfer" ADD CONSTRAINT "AssetTransfer_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "AssetLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTransfer" ADD CONSTRAINT "AssetTransfer_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "AssetLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDisposal" ADD CONSTRAINT "AssetDisposal_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "FixedAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDepreciation" ADD CONSTRAINT "AssetDepreciation_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "FixedAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepreciationSchedule" ADD CONSTRAINT "DepreciationSchedule_asset_depreciation_id_fkey" FOREIGN KEY ("asset_depreciation_id") REFERENCES "AssetDepreciation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepreciationPosting" ADD CONSTRAINT "DepreciationPosting_asset_depreciation_id_fkey" FOREIGN KEY ("asset_depreciation_id") REFERENCES "AssetDepreciation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepreciationPosting" ADD CONSTRAINT "DepreciationPosting_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "DepreciationSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepreciationPosting" ADD CONSTRAINT "DepreciationPosting_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "JournalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReceivable" ADD CONSTRAINT "CustomerReceivable_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReceivable" ADD CONSTRAINT "CustomerReceivable_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReceipt" ADD CONSTRAINT "CustomerReceipt_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReceipt" ADD CONSTRAINT "CustomerReceipt_receivable_id_fkey" FOREIGN KEY ("receivable_id") REFERENCES "CustomerReceivable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCreditLimit" ADD CONSTRAINT "CustomerCreditLimit_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCreditLimit" ADD CONSTRAINT "CustomerCreditLimit_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAging" ADD CONSTRAINT "CustomerAging_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAging" ADD CONSTRAINT "CustomerAging_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayable" ADD CONSTRAINT "VendorPayable_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayable" ADD CONSTRAINT "VendorPayable_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_payable_id_fkey" FOREIGN KEY ("payable_id") REFERENCES "VendorPayable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorCreditTerms" ADD CONSTRAINT "VendorCreditTerms_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorCreditTerms" ADD CONSTRAINT "VendorCreditTerms_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAging" ADD CONSTRAINT "VendorAging_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAging" ADD CONSTRAINT "VendorAging_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatement" ADD CONSTRAINT "BankStatement_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatement" ADD CONSTRAINT "BankStatement_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatementLine" ADD CONSTRAINT "BankStatementLine_statement_id_fkey" FOREIGN KEY ("statement_id") REFERENCES "BankStatement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatementLine" ADD CONSTRAINT "BankStatementLine_matched_journal_line_id_fkey" FOREIGN KEY ("matched_journal_line_id") REFERENCES "JournalEntryLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankReconciliation" ADD CONSTRAINT "BankReconciliation_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankReconciliation" ADD CONSTRAINT "BankReconciliation_statement_id_fkey" FOREIGN KEY ("statement_id") REFERENCES "BankStatement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankReconciliationAdjustment" ADD CONSTRAINT "BankReconciliationAdjustment_reconciliation_id_fkey" FOREIGN KEY ("reconciliation_id") REFERENCES "BankReconciliation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankReconciliationAdjustment" ADD CONSTRAINT "BankReconciliationAdjustment_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "JournalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransfer" ADD CONSTRAINT "BankTransfer_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransfer" ADD CONSTRAINT "BankTransfer_source_account_id_fkey" FOREIGN KEY ("source_account_id") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransfer" ADD CONSTRAINT "BankTransfer_destination_account_id_fkey" FOREIGN KEY ("destination_account_id") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashForecast" ADD CONSTRAINT "CashForecast_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashPosition" ADD CONSTRAINT "CashPosition_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashPosition" ADD CONSTRAINT "CashPosition_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceCheck" ADD CONSTRAINT "ComplianceCheck_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalControl" ADD CONSTRAINT "InternalControl_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoLiveChecklist" ADD CONSTRAINT "GoLiveChecklist_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemCertification" ADD CONSTRAINT "SystemCertification_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryStores" ADD CONSTRAINT "_CategoryStores_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryStores" ADD CONSTRAINT "_CategoryStores_B_fkey" FOREIGN KEY ("B") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductCategories" ADD CONSTRAINT "_ProductCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductCategories" ADD CONSTRAINT "_ProductCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductStores" ADD CONSTRAINT "_ProductStores_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductStores" ADD CONSTRAINT "_ProductStores_B_fkey" FOREIGN KEY ("B") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

