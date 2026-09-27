import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { z } from "zod";

const PRODUCT_HEADERS = ["sku", "name", "category", "unit", "supplier", "alert_threshold", "purchase_price", "sale_price"] as const;
const MAX_ROWS = 5_000;

export type ProductCsvRow = {
  sku: string;
  name: string;
  category: string;
  unit: string;
  supplier: string;
  quantity: string;
  alertThreshold: string;
};

export type ProductImportRow = {
  sku: string;
  name: string;
  category: string;
  unit: string;
  supplier?: string;
  alertThreshold: number;
  purchasePriceMinor?: number;
  salePriceMinor?: number;
};

function safeSpreadsheetCell(value: unknown) {
  const text = String(value ?? "");
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function euroToMinor(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  const amount = z.coerce.number().min(0).max(9_999_999).parse(normalized);
  return Math.round(amount * 100);
}

export function exportProductsCsv(rows: ProductCsvRow[]) {
  const records = rows.map((row) => ({
    sku: safeSpreadsheetCell(row.sku),
    name: safeSpreadsheetCell(row.name),
    category: safeSpreadsheetCell(row.category),
    unit: safeSpreadsheetCell(row.unit),
    supplier: safeSpreadsheetCell(row.supplier),
    quantity: row.quantity,
    alert_threshold: row.alertThreshold,
  }));

  return `\uFEFF${stringify(records, { header: true, delimiter: ";", quoted: true })}`;
}

export function exportMovementsCsv(rows: Array<Record<string, string>>) {
  const records = rows.map((row) => Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, safeSpreadsheetCell(value)]),
  ));
  return `\uFEFF${stringify(records, { header: true, delimiter: ";", quoted: true })}`;
}

export function parseProductImport(content: string): ProductImportRow[] {
  const records = parse(content.replace(/^\uFEFF/, ""), {
    bom: true,
    columns: true,
    delimiter: ";",
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  if (records.length > MAX_ROWS) throw new Error("Un import est limité à 5 000 lignes.");
  const headers = records.length ? Object.keys(records[0]) : [];
  if (headers.length !== PRODUCT_HEADERS.length || PRODUCT_HEADERS.some((header) => !headers.includes(header))) {
    throw new Error(`Les en-têtes attendus sont : ${PRODUCT_HEADERS.join(";")}.`);
  }

  const rowSchema = z.object({
    sku: z.string().trim().min(1).max(80),
    name: z.string().trim().min(2).max(180),
    category: z.string().trim().min(2).max(100),
    unit: z.string().trim().min(1).max(80),
    supplier: z.string().trim().max(160).optional(),
    alert_threshold: z.coerce.number().min(0).max(999_999_999),
    purchase_price: z.string().optional(),
    sale_price: z.string().optional(),
  });

  return records.map((record, index) => {
    const parsed = rowSchema.safeParse(record);
    if (!parsed.success) throw new Error(`Ligne ${index + 2} invalide : ${parsed.error.issues[0].message}`);
    return {
      sku: parsed.data.sku.toUpperCase(),
      name: parsed.data.name,
      category: parsed.data.category,
      unit: parsed.data.unit,
      supplier: parsed.data.supplier || undefined,
      alertThreshold: parsed.data.alert_threshold,
      purchasePriceMinor: euroToMinor(parsed.data.purchase_price),
      salePriceMinor: euroToMinor(parsed.data.sale_price),
    };
  });
}
