"use server";

import { prisma } from "@/lib/prisma";

/**
 * PRODUCTION-GRADE EVENT ARCHITECTURE
 * 
 * This engine handles all internal system events. It is designed to be 
 * non-blocking and fault-tolerant.
 * 
 * Events: CONTACT_CREATED, STAFF_REPLIED, BOOKING_CREATED, 
 *         FORM_COMPLETED, BOOKING_COMPLETED, INVENTORY_LOW
 */
export async function triggerAutomationFlow({ workspaceId, contactId, event, payload = {} }) {
    try {
        const contact = await prisma.contact.findUnique({
            where: { id: contactId }
        });

        if (!contact) return;

        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const portalUrl = `${baseUrl}/portal/${contactId}`;

        // Handler: PHASE 2 — AUTOMATED RESPONSE (Lead Capture)
        if (event === "CONTACT_CREATED" || event === "NEW_LEAD") {
            const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
            // 1. Send welcome message
            await dispatchNotification({
                workspaceId,
                type: "EMAIL",
                recipient: contact.email,
                payload: {
                    message: `Hi ${contact.name}, thanks for reaching out to ${workspace?.name || 'us'}. We've received your inquiry and our team will get back to you shortly. You can track our conversation here: ${portalUrl}`
                }
            });

            // 2. Create inbox notification for staff
            await prisma.internalNotification.create({
                data: {
                    workspaceId,
                    type: "inbox",
                    title: "New Inquiry Recieved",
                    message: `New message from ${contact.name}. Open inbox to reply.`,
                    link: `/dashboard/inbox`
                }
            });

            // 3. Log activity
            await prisma.auditLog.create({
                data: {
                    workspaceId,
                    action: "AUTOMATION_FIRED",
                    entity: "Event",
                    entityId: event,
                    metadata: { type: "Welcome Email", contactId }
                }
            });
        }

        // Handler: FLOW B — STEP 4 (Confirmed Booking)
        if (event === "BOOKING_CREATED") {
            const booking = await prisma.booking.findUnique({
                where: { id: payload.bookingId },
                include: { forms: true }
            });

            // Punch confirmation to Email
            await dispatchNotification({
                workspaceId,
                type: "EMAIL",
                recipient: contact.email,
                payload: {
                    message: `Confirmed: Your appointment for ${payload.serviceName} is all set. Please visit your patient portal to complete any required forms before your visit: ${portalUrl}`
                }
            });

            // Punch confirmation to SMS if phone exists
            if (contact.phone) {
                await dispatchNotification({
                    workspaceId,
                    type: "SMS",
                    recipient: contact.phone,
                    payload: {
                        message: `CareOps: Appointment confirmed for ${payload.serviceName}. View details and complete forms here: ${portalUrl}`
                    }
                });
            }

            // Internal Staff Notification
            await prisma.internalNotification.create({
                data: {
                    workspaceId,
                    type: "alert",
                    title: "New Booking Secured",
                    message: `Booking created for ${contact.name} (${payload.serviceName}). Compliance tracking enabled.`,
                    link: `/dashboard/bookings`
                }
            });
        }

        // Handler: PHASE 6 — FORM_COMPLETED
        if (event === "FORM_COMPLETED") {
            // Internal Staff Notification
            await prisma.internalNotification.create({
                data: {
                    workspaceId,
                    type: "form",
                    title: "Medical Form Received",
                    message: `${contact.name} has completed the ${payload.formName}. Ready for review.`,
                    link: `/dashboard/bookings`
                }
            });

            // Audit
            await prisma.auditLog.create({
                data: {
                    workspaceId,
                    action: "AUTOMATION_FIRED",
                    entity: "FormInstance",
                    entityId: payload.formId,
                    metadata: { type: "Form Completion Alert", contactId }
                }
            });
        }

        // Handler: INVENTORY_LOW
        if (event === "INVENTORY_LOW") {
            await prisma.internalNotification.create({
                data: {
                    workspaceId,
                    type: "inventory",
                    title: "CRITICAL: Supply Chain Alert",
                    message: `${payload.itemName} has dropped below threshold! Current stock: ${payload.currentStock}. Restock mandatory.`,
                    link: `/dashboard/inventory`
                }
            });
        }

    } catch (error) {
        console.error("[AUTOMATION-BUS-FAILURE]", error);
        // CRITICAL SAFETY RULE: Automation never blocks main flow.
        // We log it and fail silently for the end user.
    }
}

/**
 * 🔹 DISPATCHER: Multi-channel Abstraction Layer
 */
export async function dispatchNotification({ workspaceId, type, recipient, payload }) {
    try {
        if (!recipient) return { sent: false, reason: "No recipient address" };

        const channel = await prisma.communicationChannel.findFirst({
            where: { workspaceId, type, isActive: true }
        });

        if (!channel) {
            console.log(`[SYS-NOTIFY] ${type} channel inactive for workspace ${workspaceId}. Logging to DB only.`);
            return { sent: false, reason: "Channel offline" };
        }

        const config = channel.config;

        // SIMULATED PRODUCTION DISPATCH
        if (type === "EMAIL") {
            console.log(`[NODE-MAILER] Dispatched to ${recipient} via ${config.host}`);
            return { sent: true };
        }

        if (type === "SMS") {
            console.log(`[TWILIO-SMS] Dispatched to ${recipient} via sender ${config.from}`);
            return { sent: true };
        }

    } catch (error) {
        console.error("[DISPATCH-ERR]", error);
        return { sent: false, error: error.message };
    }
}
