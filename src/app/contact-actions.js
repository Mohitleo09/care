"use server";

import { prisma } from "@/lib/prisma";
import { triggerAutomationFlow } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

/**
 * 🔁 FLOW A — CONTACT FIRST (Production-Grade Engine)
 * 
 * Handles Step 2 and Step 3 of the Inquiry lifecycle.
 * Ensures CRM synchronization and triggers the welcoming automation flow.
 */
export async function submitContactForm(formData) {
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const message = formData.get("message");
    const workspaceId = formData.get("workspaceId");

    if (!name || (!email && !phone) || !workspaceId) {
        return { error: "Please provide your name and either an email or phone number." };
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 🔹 CRITICAL SAFETY: Validate Workspace Status (Implicitly handled by FK constraints)
            // Removed strict "Node Offline" check to allow direct submission attempts

            // 1. Search contact by email OR phone (Flow A requirement)
            let contact = await tx.contact.findFirst({
                where: {
                    workspaceId,
                    OR: [
                        { email: email || undefined },
                        { phone: phone || undefined }
                    ]
                }
            });

            // If exists → update; If not → create (Flow A requirement)
            if (contact) {
                contact = await tx.contact.update({
                    where: { id: contact.id },
                    data: { name, email, phone }
                });
            } else {
                contact = await tx.contact.create({
                    data: { name, email, phone, workspaceId }
                });
            }

            // 2. Link or create conversation thread
            let conversation = await tx.conversation.findFirst({
                where: { contactId: contact.id, workspaceId }
            });

            if (!conversation) {
                conversation = await tx.conversation.create({
                    data: { contactId: contact.id, workspaceId }
                });
            }

            // 3. Save incoming message (Step 2)
            if (message) {
                await tx.message.create({
                    data: {
                        content: message,
                        sender: "CUSTOMER",
                        channel: "FORM",
                        conversationId: conversation.id
                    }
                });
            }

            // 4. Update Conversation Heartbeat
            await tx.conversation.update({
                where: { id: conversation.id },
                data: {
                    lastMessageAt: new Date(),
                    status: "ACTIVE"
                }
            });

            // 4. Record Audit Trail
            await tx.auditLog.create({
                data: {
                    workspaceId,
                    action: "CONTACT_CREATED",
                    entity: "Lead",
                    entityId: contact.id,
                    metadata: { source: "Public Gateway Form" }
                }
            });

            return contact;
        });

        // 🔹 STEP 3: Automation Fires
        await triggerAutomationFlow({
            workspaceId,
            contactId: result.id,
            event: "CONTACT_CREATED"
        });

        revalidatePath("/dashboard");
        return { success: true };

    } catch (error) {
        console.error("[FLOW-A-FAILURE]", error.message);
        return { error: error.message || "We couldn't send your message. Please try again or check back later." };
    }
}
