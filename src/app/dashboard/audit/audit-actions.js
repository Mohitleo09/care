"use server";

import { prisma } from "@/lib/prisma";

/**
 * AUDIT LOG ACTIONS
 * System-wide audit trail and compliance tracking
 */

export async function getAuditLogs(workspaceId, filters = {}) {
    try {
        const { action, entity, limit = 50 } = filters;

        const logs = await prisma.auditLog.findMany({
            where: {
                workspaceId,
                ...(action && { action }),
                ...(entity && { entity })
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return logs;
    } catch (error) {
        console.error("[GET-AUDIT-LOGS]", error);
        return [];
    }
}

export async function getAuditStats(workspaceId) {
    try {
        const [totalLogs, recentActivity, actionBreakdown] = await Promise.all([
            prisma.auditLog.count({ where: { workspaceId } }),

            prisma.auditLog.count({
                where: {
                    workspaceId,
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            }),

            prisma.auditLog.groupBy({
                by: ['action'],
                where: { workspaceId },
                _count: true
            })
        ]);

        return {
            totalLogs,
            recentActivity,
            actionBreakdown
        };
    } catch (error) {
        console.error("[GET-AUDIT-STATS]", error);
        return null;
    }
}
