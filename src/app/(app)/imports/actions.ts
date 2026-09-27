"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { parseProductImport, ProductImportError } from "@/modules/csv/csv";

export type ImportState = { error?: string; success?: string };

export async function importProducts(_: ImportState, formData: FormData): Promise<ImportState> {
  const admin = await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) return { error: "Sélectionnez un fichier CSV." };
  if (file.size > 5 * 1024 * 1024) return { error: "Le fichier dépasse la limite de 5 Mio." };

  try {
    const rows = parseProductImport(await file.text());
    if (!rows.length) return { error: "Le fichier ne contient aucun produit." };
    const duplicateSku = rows.find((row, index) => rows.findIndex((candidate) => candidate.sku === row.sku) !== index)?.sku;
    if (duplicateSku) return { error: `La référence ${duplicateSku} apparaît plusieurs fois dans le fichier.` };

    const [categories, units, suppliers, existing] = await Promise.all([
      prisma.category.findMany({ where: { isActive: true } }),
      prisma.unit.findMany({ where: { isActive: true } }),
      prisma.supplier.findMany({ where: { isActive: true } }),
      prisma.product.findMany({ where: { sku: { in: rows.map((row) => row.sku) } }, select: { sku: true } }),
    ]);
    if (existing.length) return { error: `Référence déjà existante : ${existing[0].sku}. L’import est en mode création uniquement.` };

    const categoryByName = new Map(categories.map((item) => [item.name.toLocaleLowerCase("fr"), item.id]));
    const unitByName = new Map(units.map((item) => [item.name.toLocaleLowerCase("fr"), item.id]));
    const supplierByName = new Map(suppliers.map((item) => [item.name.toLocaleLowerCase("fr"), item.id]));
    const resolved = rows.map((row, index) => {
      const categoryId = categoryByName.get(row.category.toLocaleLowerCase("fr"));
      const unitId = unitByName.get(row.unit.toLocaleLowerCase("fr"));
      const supplierId = row.supplier ? supplierByName.get(row.supplier.toLocaleLowerCase("fr")) : undefined;
      if (!categoryId) throw new ProductImportError(`Ligne ${index + 2} : catégorie « ${row.category} » inconnue ou inactive.`);
      if (!unitId) throw new ProductImportError(`Ligne ${index + 2} : unité « ${row.unit} » inconnue ou inactive.`);
      if (row.supplier && !supplierId) throw new ProductImportError(`Ligne ${index + 2} : fournisseur « ${row.supplier} » inconnu ou inactif.`);
      return { row, categoryId, unitId, supplierId };
    });

    await prisma.$transaction(async (tx) => {
      for (const item of resolved) {
        const product = await tx.product.create({ data: {
          sku: item.row.sku,
          name: item.row.name,
          categoryId: item.categoryId,
          unitId: item.unitId,
          supplierId: item.supplierId,
          alertThreshold: item.row.alertThreshold,
          purchasePriceMinor: item.row.purchasePriceMinor,
          salePriceMinor: item.row.salePriceMinor,
          createdById: admin.id,
          inventory: { create: { quantity: 0 } },
        } });
        await tx.auditLog.create({ data: { userId: admin.id, action: "PRODUCT_IMPORTED", entityType: "Product", entityId: product.id, metadata: { sku: product.sku } } });
      }
    });

    revalidatePath("/produits");
    return { success: `${rows.length} produit(s) importé(s). Le stock reste à zéro jusqu’à une entrée dédiée.` };
  } catch (error) {
    return { error: error instanceof ProductImportError ? error.message : "L’import a échoué sans modifier le catalogue." };
  }
}
