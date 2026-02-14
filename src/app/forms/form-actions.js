"use server";

import { prisma } from "@/lib/prisma";
import { emitEvent } from "@/lib/events";
import { revalidatePath } from "next/cache";

/**
 * FORM SUBMISSION ENGINE
 * Atomic processing of customer-submitted protocols.
 */
export async function submitProtocolForm(formData) {
    const instanceId = formData.get("instanceId");
    const token = formData.get("token");
    const dataString = formData.get("data");

    if (!instanceId || !dataString) {
        return { error: "Transmission error: Protocol data payload is incomplete." };
    }

    try {
        const data = JSON.parse(dataString);

        // 1. PRODUCTION TRANSACTION: Save submission and update instance status
        const result = await prisma.$transaction(async (tx) => {
            // Check if already completed to prevent duplicate events
            const instance = await tx.formInstance.findUnique({
                where: { id: instanceId },
                select: { status: true, workspaceId: true, token: true }
            });

            if (instance.status === "COMPLETED") {
                throw new Error("Protocol already fulfilled.");
            }

            // Create Submission Record
            const submission = await tx.formSubmission.create({
                data: {
                    formInstanceId: instanceId,
                    data: data
                }
            });

            // Update Instance Node
            const updatedInstance = await tx.formInstance.update({
                where: { id: instanceId },
                data: { status: "COMPLETED" },
                include: { booking: true }
            });

            return { submission, updatedInstance };
        });

        // 2. EMIT EVENT (Triggers internal staff alerts and preparation flows)
        await emitEvent("FORM_COMPLETED", {
            workspaceId: result.updatedInstance.booking.workspaceId,
            entity: "FormInstance",
            entityId: instanceId,
            bookingId: result.updatedInstance.bookingId,
            metadata: { token }
        });

        revalidatePath(`/form/${token}`);
        return { success: true };

    } catch (error) {
        console.error("[PROTOCOL_SUBMISSION_FAILURE]", error);
        return { error: error.message || "Encryption failure during transmission. Please try again." };
    }
}
