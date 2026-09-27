import { prisma } from "@/lib/prisma";
import { getApiAdmin } from "@/lib/api-auth";
import { exportMovementsCsv } from "@/modules/csv/csv";

export async function GET() {
  const access = await getApiAdmin();
  if ("error" in access) return access.error;
  const movements = await prisma.stockMovement.findMany({
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    include: { product: true, user: { select: { name: true } }, supplier: true },
  });
  const csv = exportMovementsCsv(movements.map((movement) => ({
    occurred_at: movement.occurredAt.toISOString(),
    sku: movement.product.sku,
    product: movement.product.name,
    type: movement.type,
    reason: movement.reason,
    quantity: movement.quantity.toString(),
    delta: movement.delta.toString(),
    stock_before: movement.stockBefore.toString(),
    stock_after: movement.stockAfter.toString(),
    supplier: movement.supplier?.name ?? "",
    reference: movement.reference ?? "",
    operator: movement.user.name,
  })));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rozi-mouvements-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
