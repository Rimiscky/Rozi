import { describe, expect, it } from "vitest";
import { hasPermission } from "./permission-policy";

describe("matrice de permissions", () => {
  it("autorise les opérations quotidiennes à un employé sans exposer l’administration", () => {
    expect(hasPermission("EMPLOYEE", "inventory.read")).toBe(true);
    expect(hasPermission("EMPLOYEE", "movement.create")).toBe(true);
    expect(hasPermission("EMPLOYEE", "report.read")).toBe(true);
    expect(hasPermission("EMPLOYEE", "catalog.write")).toBe(false);
    expect(hasPermission("EMPLOYEE", "audit.read")).toBe(false);
    expect(hasPermission("EMPLOYEE", "user.admin")).toBe(false);
  });

  it("accorde toutes les capacités définies à l’administrateur", () => {
    expect(hasPermission("ADMIN", "csv.import")).toBe(true);
    expect(hasPermission("ADMIN", "purchase_order.receive")).toBe(true);
    expect(hasPermission("ADMIN", "audit.read")).toBe(true);
  });
});
