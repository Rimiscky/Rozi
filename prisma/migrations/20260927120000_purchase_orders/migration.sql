-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED');

-- Extend suppliers without breaking existing rows.
ALTER TABLE "suppliers"
  ADD COLUMN "code" VARCHAR(40),
  ADD COLUMN "contactName" VARCHAR(160),
  ADD COLUMN "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "leadTimeDays" INTEGER,
  ADD COLUMN "notes" TEXT;
UPDATE "suppliers" SET "code" = 'SUP-' || UPPER(SUBSTRING("id"::text, 1, 8)) WHERE "code" IS NULL;
ALTER TABLE "suppliers" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_payment_terms_non_negative" CHECK ("paymentTermsDays" >= 0);
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_lead_time_non_negative" CHECK ("leadTimeDays" IS NULL OR "leadTimeDays" >= 0);

-- CreateTable
CREATE TABLE "purchase_orders" (
  "id" UUID NOT NULL,
  "number" VARCHAR(40) NOT NULL,
  "supplierId" UUID NOT NULL,
  "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "orderedAt" TIMESTAMP(3),
  "expectedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "purchase_order_lines" (
  "id" UUID NOT NULL,
  "purchaseOrderId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "quantity" DECIMAL(18,3) NOT NULL,
  "receivedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
  "unitPriceMinor" INTEGER,
  "productSkuSnapshot" VARCHAR(80) NOT NULL,
  "productNameSnapshot" VARCHAR(180) NOT NULL,
  "unitSymbolSnapshot" VARCHAR(20) NOT NULL,
  CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "stock_movements" ADD COLUMN "purchaseOrderLineId" UUID;
CREATE UNIQUE INDEX "purchase_orders_number_key" ON "purchase_orders"("number");
CREATE INDEX "purchase_orders_status_expectedAt_idx" ON "purchase_orders"("status", "expectedAt");
CREATE INDEX "purchase_orders_supplierId_createdAt_idx" ON "purchase_orders"("supplierId", "createdAt" DESC);
CREATE UNIQUE INDEX "purchase_order_lines_purchaseOrderId_position_key" ON "purchase_order_lines"("purchaseOrderId", "position");
CREATE INDEX "purchase_order_lines_productId_idx" ON "purchase_order_lines"("productId");
CREATE UNIQUE INDEX "stock_movements_purchaseOrderLineId_key" ON "stock_movements"("purchaseOrderLineId");

ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_purchaseOrderLineId_fkey" FOREIGN KEY ("purchaseOrderLineId") REFERENCES "purchase_order_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_received_valid" CHECK ("receivedQuantity" >= 0 AND "receivedQuantity" <= "quantity");
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_unit_price_non_negative" CHECK ("unitPriceMinor" IS NULL OR "unitPriceMinor" >= 0);
