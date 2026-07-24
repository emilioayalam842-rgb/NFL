import { prisma } from "@/lib/prisma";

/** Records who did what to a momio/prop, for the admin audit log. */
export async function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  detail?: string
) {
  await prisma.auditLog.create({ data: { userId, action, entityType, entityId, detail } });
}
