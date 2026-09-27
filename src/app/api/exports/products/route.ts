import { prisma } from "@/lib/prisma";
import { getApiAdmin } from "@/lib/api-auth";
import { exportProductsCsv } from "@/modules/csv/csv";

export async function GET() {
  const access = await getApiAdmin();
  if ("error" in access) return access.error;
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: { category: true, unit: true, supplier: true },
  });
  const csv = exportProductsCsv(products.map((product) => ({
    sku: product.sku,
    name: product.name,
    category: product.category.name,
    unit: product.unit.name,
    supplier: product.supplier?.name ?? "",
    alertThreshold: product.alertThreshold.toString(),
    purchasePrice: product.purchasePriceMinor === null ? "" : (product.purchasePriceMinor / 100).toFixed(2),
    salePrice: product.salePriceMinor === null ? "" : (product.salePriceMinor / 100).toFixed(2),
  })));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rozi-produits-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
