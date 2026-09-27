import type { UserRole } from "@/generated/prisma/client";

export type Permission =
  | "inventory.read"
  | "movement.create"
  | "adjustment.create"
  | "catalog.write"
  | "supplier.write"
  | "purchase_order.write"
  | "purchase_order.receive"
  | "report.read"
  | "csv.export"
  | "csv.import"
  | "audit.read"
  | "user.admin";

const employeePermissions = new Set<Permission>(["inventory.read", "movement.create", "report.read"]);

export function hasPermission(role: UserRole, permission: Permission) {
  return role === "ADMIN" || employeePermissions.has(permission);
}
