CREATE OR REPLACE FUNCTION prevent_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% est un journal append-only', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- Append-only journals must not depend on cascading updates when a referenced row is deleted.
ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_supplierId_fkey";
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A movement ledger entry must be internally consistent before it becomes immutable.
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_balance_consistent" CHECK ("stockAfter" = "stockBefore" + "delta");
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_quantity_matches_delta" CHECK ("quantity" = ABS("delta"));
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_delta_direction" CHECK (
  ("type" = 'IN' AND "delta" > 0) OR
  ("type" = 'OUT' AND "delta" < 0) OR
  ("type" = 'ADJUSTMENT' AND "delta" <> 0)
);

CREATE TRIGGER stock_movements_append_only
BEFORE UPDATE OR DELETE ON "stock_movements"
FOR EACH ROW EXECUTE FUNCTION prevent_log_mutation();

CREATE TRIGGER stock_movements_no_truncate
BEFORE TRUNCATE ON "stock_movements"
FOR EACH STATEMENT EXECUTE FUNCTION prevent_log_mutation();

CREATE TRIGGER audit_logs_append_only
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW EXECUTE FUNCTION prevent_log_mutation();

CREATE TRIGGER audit_logs_no_truncate
BEFORE TRUNCATE ON "audit_logs"
FOR EACH STATEMENT EXECUTE FUNCTION prevent_log_mutation();
