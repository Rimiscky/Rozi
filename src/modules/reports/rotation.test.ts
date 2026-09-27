import { describe, expect, it } from "vitest";
import { calculateRotationMetrics } from "./rotation";

const day = 86_400_000;

describe("indicateurs de rotation", () => {
  it("pondère le stock moyen dans le temps et calcule la couverture", () => {
    const start = new Date("2026-01-01T00:00:00.000Z");
    const end = new Date(start.getTime() + 30 * day);
    const metrics = calculateRotationMetrics({
      currentStock: 50,
      start,
      end,
      movements: [
        { occurredAt: new Date(start.getTime() + 10 * day), delta: -30, type: "OUT", reason: "SALE" },
        { occurredAt: new Date(start.getTime() + 20 * day), delta: -20, type: "OUT", reason: "INTERNAL_USE" },
      ],
    });

    expect(metrics.demandOut).toBe(50);
    expect(metrics.averageStock).toBeCloseTo(73.333, 3);
    expect(metrics.rotation).toBeCloseTo(0.682, 3);
    expect(metrics.coverageDays).toBeCloseTo(30, 3);
    expect(metrics.daysSinceLastDemand).toBeCloseTo(10, 3);
  });

  it("n’invente pas de rotation sans demande ou sans stock moyen", () => {
    const metrics = calculateRotationMetrics({ currentStock: 0, start: new Date("2026-01-01"), end: new Date("2026-01-31"), movements: [] });
    expect(metrics.rotation).toBeNull();
    expect(metrics.coverageDays).toBeNull();
    expect(metrics.daysSinceLastDemand).toBeNull();
  });
});
