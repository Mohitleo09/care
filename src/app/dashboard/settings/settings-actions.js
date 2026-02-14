"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function getWorkspaceSettings() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.workspaceId) throw new Error("Unauthorized");

    return await prisma.workspace.findUnique({
        where: { id: session.user.workspaceId },
        include: {
            channels: true,
            contactForms: true
        }
    });
}

export async function updateChannelConfig(channelId, config) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.workspaceId) throw new Error("Unauthorized");

    await prisma.communicationChannel.update({
        where: { id: channelId },
        data: { config }
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function updateOrganization(data) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.workspaceId) throw new Error("Unauthorized");

    await prisma.workspace.update({
        where: { id: session.user.workspaceId },
        data: {
            name: data.name,
            address: data.address,
            timezone: data.timezone
        }
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
}
