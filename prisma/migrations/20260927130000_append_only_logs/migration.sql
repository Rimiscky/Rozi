CREATE OR REPLACE FUNCTION prevent_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% est un journal append-only', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_movements_append_only
BEFORE UPDATE OR DELETE ON "stock_movements"
FOR EACH ROW EXECUTE FUNCTION prevent_log_mutation();

CREATE TRIGGER audit_logs_append_only
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW EXECUTE FUNCTION prevent_log_mutation();
