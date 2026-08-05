-- Website "Wishlist" -- heart icon on a product card.
CREATE TABLE "CustomerFavorite" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerFavorite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerFavorite_customer_id_product_id_key" ON "CustomerFavorite"("customer_id", "product_id");
CREATE INDEX "CustomerFavorite_customer_id_idx" ON "CustomerFavorite"("customer_id");

ALTER TABLE "CustomerFavorite" ADD CONSTRAINT "CustomerFavorite_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerFavorite" ADD CONSTRAINT "CustomerFavorite_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
