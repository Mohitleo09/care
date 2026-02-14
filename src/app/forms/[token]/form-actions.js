"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { triggerAutomationFlow } from "@/lib/notifications";

/**
 * FORM SUBMISSION ACTIONS
 * Handles public form submissions via secure tokens
 */

export async function submitProtocolForm(formData) {
    const token = formData.get("token");
    const data = formData.get("data");

    if (!token) {
        return { error: "Invalid form access token" };
    }

    try {
        // Find form instance by token
        const formInstance = await prisma.formInstance.findFirst({
            where: { accessToken: token },
            include: {
                formTemplate: true,
                booking: {
                    include: {
                        contact: true
                    }
                }
            }
        });

        if (!formInstance) {
            return { error: "Form not found or expired" };
        }

        if (formInstance.status === "COMPLETED") {
            return { error: "Form already submitted" };
        }

        // Update form instance and create submission record
        await prisma.$transaction([
            prisma.formInstance.update({
                where: { id: formInstance.id },
                data: {
                    status: "COMPLETED",
                }
            }),
            prisma.formSubmission.create({
                data: {
                    formInstanceId: formInstance.id,
                    data: JSON.parse(data)
                }
            })
        ]);

        // 🔹 PHASE 6 — TRIGGER FORM_COMPLETED EVENT
        await triggerAutomationFlow({
            workspaceId: formInstance.booking.contact.workspaceId,
            contactId: formInstance.booking.contactId,
            event: "FORM_COMPLETED",
            payload: {
                formName: formInstance.formTemplate.name,
                bookingId: formInstance.bookingId
            }
        });

        revalidatePath(`/portal/${formInstance.booking.contactId}`);
        return { success: true };

    } catch (error) {
        console.error("[SUBMIT-PROTOCOL-FORM]", error);
        return { error: "Failed to submit form" };
    }
}

export async function getFormByToken(token) {
    try {
        const formInstance = await prisma.formInstance.findFirst({
            where: { accessToken: token },
            include: {
                formTemplate: true,
                booking: {
                    include: {
                        contact: true,
                        serviceType: true
                    }
                }
            }
        });

        return formInstance;
    } catch (error) {
        console.error("[GET-FORM-BY-TOKEN]", error);
        return null;
    }
}
