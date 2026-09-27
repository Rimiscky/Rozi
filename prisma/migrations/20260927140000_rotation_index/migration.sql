CREATE INDEX "stock_movements_productId_type_occurredAt_idx"
ON "stock_movements"("productId", "type", "occurredAt" DESC);