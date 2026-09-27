const DAY_MS = 86_400_000;
const DEMAND_REASONS = new Set(["SALE", "INTERNAL_USE"]);

type RotationMovement = {
  occurredAt: Date;
  delta: number;
  type: string;
  reason: string;
};

type RotationInput = {
  currentStock: number;
  start: Date;
  end: Date;
  movements: RotationMovement[];
};

export function calculateRotationMetrics({ currentStock, start, end, movements }: RotationInput) {
  const duration = Math.max(end.getTime() - start.getTime(), 1);
  const inRange = movements
    .filter((movement) => movement.occurredAt >= start && movement.occurredAt <= end)
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  let stock = currentStock - inRange.reduce((sum, movement) => sum + movement.delta, 0);
  let previousTime = start.getTime();
  let weightedStock = 0;
  for (const movement of inRange) {
    const movementTime = Math.min(Math.max(movement.occurredAt.getTime(), previousTime), end.getTime());
    weightedStock += stock * (movementTime - previousTime);
    stock += movement.delta;
    previousTime = movementTime;
  }
  weightedStock += stock * (end.getTime() - previousTime);
  const averageStock = weightedStock / duration;
  const demandMovements = inRange.filter((movement) => movement.type === "OUT" && DEMAND_REASONS.has(movement.reason));
  const demandOut = demandMovements.reduce((sum, movement) => sum + Math.abs(movement.delta), 0);
  const days = duration / DAY_MS;
  const dailyDemand = demandOut / days;
  const lastDemand = demandMovements.at(-1)?.occurredAt;

  return {
    demandOut,
    averageStock,
    rotation: demandOut > 0 && averageStock > 0 ? demandOut / averageStock : null,
    coverageDays: dailyDemand > 0 ? currentStock / dailyDemand : null,
    daysSinceLastDemand: lastDemand ? (end.getTime() - lastDemand.getTime()) / DAY_MS : null,
  };
}
