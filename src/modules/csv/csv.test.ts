import { describe, expect, it } from "vitest";
import { exportProductsCsv, parseProductImport } from "./csv";

describe("exports CSV", () => {
  it("neutralise les formules tableur et produit un CSV Excel en UTF-8", () => {
    const output = exportProductsCsv([{ sku: "=CMD", name: "+Produit", category: "Outillage", unit: "pce", supplier: "@Fournisseur", alertThreshold: "1", purchasePrice: "1.00", salePrice: "2.00" }]);

    expect(output.startsWith("\uFEFF")).toBe(true);
    expect(output).toContain("'=CMD");
    expect(output).toContain("'+Produit");
    expect(output).toContain("'@Fournisseur");
  });

  it("produit un catalogue qui peut être réimporté", () => {
    const output = exportProductsCsv([{ sku: "VIS-001", name: "Vis bois", category: "Visserie", unit: "pièce", supplier: "Fournisseur démo", alertThreshold: "10", purchasePrice: "0.12", salePrice: "0.25" }]);
    expect(parseProductImport(output)).toEqual([{ sku: "VIS-001", name: "Vis bois", category: "Visserie", unit: "pièce", supplier: "Fournisseur démo", alertThreshold: 10, purchasePriceMinor: 12, salePriceMinor: 25 }]);
  });
});

describe("imports CSV", () => {
  it("valide et normalise un catalogue", () => {
    const result = parseProductImport("sku;name;category;unit;supplier;alert_threshold;purchase_price;sale_price\n vis-001 ;Vis bois;Visserie;pièce;Fournisseur démo;10;0.12;0.25");

    expect(result).toEqual([{ sku: "VIS-001", name: "Vis bois", category: "Visserie", unit: "pièce", supplier: "Fournisseur démo", alertThreshold: 10, purchasePriceMinor: 12, salePriceMinor: 25 }]);
  });

  it("refuse les en-têtes inconnus et plus de 5 000 lignes", () => {
    expect(() => parseProductImport("sku;name\nA;Produit")).toThrow(/en-têtes/i);
    const rows = Array.from({ length: 5001 }, (_, index) => `SKU-${index};Produit ${index};Visserie;pièce;;0;;`).join("\n");
    expect(() => parseProductImport(`sku;name;category;unit;supplier;alert_threshold;purchase_price;sale_price\n${rows}`)).toThrow(/5 000/);
  });
});
