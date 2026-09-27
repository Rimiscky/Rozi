import type { Prisma } from "@/generated/prisma/client";

export type AuditEvent = {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  context?: Record<string, unknown>;
};

type AuditClient = Pick<Prisma.TransactionClient, "auditLog">;

export function writeAudit(client: AuditClient, event: AuditEvent) {
  return client.auditLog.create({ data: {
    userId: event.userId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    metadata: {
      ...(event.before ? { before: event.before } : {}),
      ...(event.after ? { after: event.after } : {}),
      ...(event.context ? { context: event.context } : {}),
    } as Prisma.InputJsonValue,
  } });
}
