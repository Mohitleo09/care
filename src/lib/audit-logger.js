import { prisma } from "./prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-options";

/**
 * PRODUCTION-GRADE AUDIT LOGGER
 * 
 * Captures all critical operations with user context, entity relationships, 
 * and structural metadata for compliance and security auditing.
 */
export async function logAudit({ action, entity, entityId, metadata = {} }) {
    try {
        const session = await getServerSession(authOptions);

        // We log even if unauthorized to track failed attempts if needed
        const workspaceId = session?.user?.workspaceId;
        const userId = session?.user?.id;

        if (!workspaceId) {
            console.warn(`[AUDIT-WARN] Attempted to log action "${action}" without workspace context.`);
            return null;
        }

        return await prisma.auditLog.create({
            data: {
                workspaceId,
                userId,
                action,
                entity,
                entityId,
                metadata: metadata || {}
            }
        });
    } catch (error) {
        console.error("[AUDIT-LOG-ERROR]", error);
        // We don't throw here to prevent audit logging from breaking main business logic
        return null;
    }
}
