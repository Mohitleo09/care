"use server";

import { prisma } from "@/lib/prisma";

/**
 * DEMO BOOKING ACTIONS
 * Simplified booking flow for demonstration purposes
 */

export async function getDemoServices(workspaceId) {
    try {
        const services = await prisma.serviceType.findMany({
            where: { workspaceId, isActive: true },
            include: {
                availability: true
            }
        });
        return services;
    } catch (error) {
        console.error("[GET-DEMO-SERVICES]", error);
        return [];
    }
}
