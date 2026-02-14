"use server";

import { prisma } from "@/lib/prisma";
import { triggerAutomationFlow } from "@/lib/notifications";
import nodemailer from "nodemailer";
import crypto from "crypto";

/**
 * 🔍 SLOT GENERATOR (Flow B Step 2)
 * Computes available time windows server-side based on clinic hours and resource constraints.
 */
export async function getAvailableSlots(serviceId, dateStr) {
    try {
        const targetDate = new Date(dateStr);
        const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });

        const service = await prisma.serviceType.findUnique({
            where: { id: serviceId },
            include: {
                availability: { where: { dayOfWeek } },
                resources: { include: { inventoryItem: true } }
            }
        });

        if (!service || service.availability.length === 0) return [];

        const availability = service.availability[0];
        const [startH, startM] = availability.startTime.split(':').map(Number);
        const [endH, endM] = availability.endTime.split(':').map(Number);

        const dayStart = new Date(targetDate.setHours(startH, startM, 0, 0));
        const dayEnd = new Date(targetDate.setHours(endH, endM, 0, 0));

        // Fetch existing bookings for this day to check overlaps
        const existingBookings = await prisma.booking.findMany({
            where: {
                serviceTypeId: serviceId,
                status: "CONFIRMED",
                dateTime: {
                    gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                    lt: new Date(targetDate.setHours(23, 59, 59, 999))
                }
            }
        });

        const slots = [];
        let currentSlot = new Date(dayStart);
        const durationWithBuffer = (service.duration + (service.bufferTime || 0)) * 60000;

        while (currentSlot.getTime() + (service.duration * 60000) <= dayEnd.getTime()) {
            const slotEnd = new Date(currentSlot.getTime() + (service.duration * 60000));

            // Check for overlaps
            const isOccupied = existingBookings.some(b => {
                const bStart = new Date(b.dateTime);
                const bEnd = new Date(bStart.getTime() + (service.duration * 60000));
                return (currentSlot < bEnd && slotEnd > bStart);
            });

            if (!isOccupied) {
                slots.push(new Date(currentSlot));
            }

            currentSlot = new Date(currentSlot.getTime() + durationWithBuffer);
        }

        return slots;
    } catch (error) {
        console.error("[SLOT-GENERATION-ERROR]", error);
        return [];
    }
}

/**
 * 🔁 FLOW B — BOOKING FIRST (Production-Grade Engine)
 * 
 * This engine handles the critical backend transaction for direct bookings.
 * It enforces atomic isolation: If inventory check or contact creation fails, 
 * the entire booking is rolled back.
 */
export async function submitBooking(formData) {
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const serviceTypeId = formData.get("serviceTypeId");
    const dateTime = new Date(formData.get("dateTime"));
    const workspaceId = formData.get("workspaceId");

    if (!name || (!email && !phone) || !serviceTypeId || !dateTime) {
        return { error: "Please provide your name and at least one contact method." };
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch Workspace
            const workspace = await tx.workspace.findUnique({
                where: { id: workspaceId }
            });

            if (!workspace) {
                throw new Error("We couldn't find the practice you're looking for. Please try again.");
            }

            // 2. Resource & Inventory Check
            const service = await tx.serviceType.findUnique({
                where: { id: serviceTypeId },
                include: {
                    resources: { include: { inventoryItem: true } },
                    formLinks: { include: { formTemplate: true } }
                }
            });

            if (!service) throw new Error("This service is no longer available.");

            // 3. Slot Revalidation (Step 4.1)
            // Prevent race conditions: Check if this exact slot is still free
            const isTaken = await tx.booking.findFirst({
                where: {
                    serviceTypeId,
                    dateTime,
                    status: "CONFIRMED"
                }
            });

            if (isTaken) {
                throw new Error("This time slot was just taken. Please select another time.");
            }

            // Check availability for each required resource
            for (const res of service.resources) {
                const item = res.inventoryItem;
                const requiredQty = res.quantity;

                if (item.type === "CONSUMABLE") {
                    if (item.availableQuantity < requiredQty) {
                        throw new Error(`Insufficient stock for ${item.name}. Please contact us.`);
                    }

                    // Deduct permanently
                    await tx.inventoryItem.update({
                        where: { id: item.id },
                        data: {
                            availableQuantity: { decrement: requiredQty }
                        }
                    });

                    // Alert check if below threshold
                    const updatedItem = await tx.inventoryItem.findUnique({ where: { id: item.id } });
                    if (updatedItem.availableQuantity <= updatedItem.lowStockThreshold) {
                        await tx.internalNotification.create({
                            data: {
                                workspaceId,
                                type: "INVENTORY_LOW",
                                title: "Low Stock Alert",
                                message: `${item.name} is running low (${updatedItem.availableQuantity} left).`,
                                link: "/dashboard/inventory"
                            }
                        });
                    }
                } else if (item.type === "REUSABLE") {
                    // Scenario B: Reusable (Capacity-based Reservation)
                    // Check for overlapping bookings that use this same resource
                    const startTime = dateTime;
                    const endTime = new Date(dateTime.getTime() + (service.duration + (service.bufferTime || 0)) * 60000);

                    // Find all CONFIRMED bookings for services that use this resource during this time
                    const overlappingBookings = await tx.booking.findMany({
                        where: {
                            status: "CONFIRMED",
                            dateTime: {
                                lt: endTime,
                                gte: new Date(startTime.getTime() - 120 * 60000) // Look back 2 hours to catch long bookings
                            },
                        },
                        include: {
                            serviceType: {
                                include: {
                                    resources: {
                                        where: { inventoryItemId: item.id }
                                    }
                                }
                            }
                        }
                    });

                    // Calculate total resource usage at the requested time
                    // For each overlapping booking, calculate its end time and see if it truly overlaps
                    let currentUsage = 0;
                    for (const ob of overlappingBookings) {
                        if (ob.serviceType.resources.length === 0) continue;

                        const obStart = new Date(ob.dateTime);
                        const obEnd = new Date(obStart.getTime() + (ob.serviceType.duration + (ob.serviceType.bufferTime || 0)) * 60000);

                        // Check if time windows overlap
                        if (obStart < endTime && obEnd > startTime) {
                            currentUsage += ob.serviceType.resources[0].quantity;
                        }
                    }

                    if (currentUsage + requiredQty > item.totalQuantity) {
                        throw new Error(`Resource Conflict: ${item.name} capacity full for this time slot.`);
                    }
                }
            }

            // 4. Identity Linking (CRM Logic)
            let contact = await tx.contact.findFirst({
                where: {
                    workspaceId,
                    OR: [
                        { email: email || undefined },
                        { phone: phone || undefined }
                    ]
                }
            });

            if (!contact) {
                contact = await tx.contact.create({
                    data: { name, email, phone, workspaceId }
                });
            }

            // 5. Create Booking Record
            const booking = await tx.booking.create({
                data: {
                    dateTime,
                    status: "CONFIRMED", // Set to confirmed because inventory is secured
                    contactId: contact.id,
                    serviceTypeId
                }
            });

            // 6. Thread Initialization (Conversation Flow)
            let conversation = await tx.conversation.findFirst({
                where: { contactId: contact.id, workspaceId }
            });

            if (!conversation) {
                conversation = await tx.conversation.create({
                    data: { contactId: contact.id, workspaceId }
                });
            }

            // Create initial system message in thread
            await tx.message.create({
                data: {
                    conversationId: conversation.id,
                    sender: "SYSTEM",
                    channel: "FORM",
                    content: `New Booking Request: ${name} scheduled ${service.name} for ${dateTime.toLocaleString()}.`
                }
            });

            // 7. Dynamic Form Provisioning

            // For every form template linked to this service, create a unique instance
            const formInstances = [];
            for (const link of service.formLinks) {
                const accessToken = crypto.randomBytes(32).toString("hex");

                const instance = await tx.formInstance.create({
                    data: {
                        bookingId: booking.id,
                        formTemplateId: link.formTemplateId,
                        status: "PENDING",
                        dueDate: dateTime,
                        accessToken
                    }
                });
                formInstances.push(instance);
            }

            return { booking, contact, conversation, formInstances, service };
        });

        // 8. Send Confirmation Email (Always attempt if email provided)
        if (email) {
            try {
                // Check for environment variables first
                if (!process.env.email_user || !process.env.app_password) {
                    console.error("[MAIL-ENGINE] Missing email credentials (email_user or app_password). Email skipped.");
                } else {
                    const workspace = await prisma.workspace.findUnique({
                        where: { id: workspaceId },
                        include: {
                            channels: {
                                where: { type: "EMAIL", isActive: true }
                            }
                        }
                    });

                    const emailChannel = workspace?.channels[0];
                    // Use environment variables as primary fallback if channel config is missing
                    const config = emailChannel?.config || {
                        host: "smtp.gmail.com",
                        port: 587,
                        user: process.env.email_user,
                        pass: process.env.app_password,
                        secure: false
                    };

                    // Use environment variables directly as the primary source of truth for email credentials
                    // This bypasses potential issues where workspace config might be empty or misconfigured
                    const smtpUser = process.env.email_user;
                    const smtpPass = process.env.app_password;

                    if (!smtpUser || !smtpPass) {
                        console.error("[MAIL-ENGINE] Missing environment variables: email_user or app_password. Email skipped.");
                    } else {
                        const { host, port, secure } = config;
                        console.log(`[MAIL-ENGINE] Attempting to send using user: ${smtpUser}`);

                        const transporter = nodemailer.createTransport({
                            host: host || "smtp.gmail.com",
                            port: parseInt(port) || 587,
                            secure: secure || false,
                            auth: { user: smtpUser, pass: smtpPass },
                            tls: { rejectUnauthorized: false }
                        });

                        await transporter.verify();
                        console.log("[MAIL-ENGINE] Transporter ready.");

                        const appointmentDate = new Date(dateTime).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        // Prepare form links if they exist
                        let formLinksHtml = "";
                        if (result.formInstances.length > 0) {
                            const formTemplates = await prisma.formTemplate.findMany({
                                where: {
                                    id: { in: result.formInstances.map(f => f.formTemplateId) }
                                }
                            });

                            formLinksHtml = `
                                <h3 style="color: #0F172A; font-size: 16px; margin-top: 32px;">Required Documentation</h3>
                                <p>Please complete the following forms before your visit:</p>
                                ${result.formInstances.map((instance, idx) => {
                                const template = formTemplates.find(t => t.id === instance.formTemplateId);
                                const formLink = `${process.env.NEXTAUTH_URL}/forms/${instance.accessToken}`;
                                return `
                                        <div style="background: #F8FAFC; padding: 16px; border-radius: 8px; margin: 12px 0;">
                                            <p style="margin: 0; font-weight: bold; color: #0F172A;">${idx + 1}. ${template?.name || 'Required Form'}</p>
                                            <a href="${formLink}" 
                                               style="display: inline-block; margin-top: 8px; color: #2563EB; text-decoration: none; font-size: 14px; font-weight: 600;">
                                                Complete this form →
                                            </a>
                                        </div>
                                    `;
                            }).join('')}
                                <p style="margin-top: 24px; color: #64748B; font-size: 14px;">
                                    Completing these forms in advance will save you time during check-in.
                                </p>
                            `;
                        }

                        await transporter.sendMail({
                            from: `"${workspace.name}" <${smtpUser}>`,
                            to: email,
                            subject: result.formInstances.length > 0
                                ? `Confirmed: ${result.service.name} - Action Required`
                                : `Confirmed: ${result.service.name}`,
                            html: `
                                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px;">
                                    <h2 style="color: #0F172A;">Your Appointment is Confirmed!</h2>
                                    <p>Hi ${name},</p>
                                    <p>Thank you for booking with ${workspace.name}. Your appointment details are below:</p>
                                    
                                    <div style="background: #0F172A; color: white; padding: 20px; border-radius: 8px; margin: 24px 0;">
                                        <p style="margin: 0; font-size: 14px; opacity: 0.8;">Service</p>
                                        <p style="margin: 8px 0 4px 0; font-size: 18px; font-weight: bold;">${result.service.name}</p>
                                        <p style="margin: 0; font-size: 14px;">${appointmentDate}</p>
                                        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.8;">Location: ${result.service.location || 'In-person'}</p>
                                    </div>

                                    ${formLinksHtml}

                                    <p style="margin-top: 32px;">If you need to reschedule or have questions, please contact us.</p>
                                    <p style="margin-top: 32px;">Best regards,<br>${workspace.name}</p>
                                </div>
                            `
                        });
                        console.log(`[MAIL-ENGINE] Email DISPATCHED to ${email}`);
                    }
                }
            } catch (emailError) {
                console.error("[CONFIRMATION-EMAIL-FAILURE]", emailError);
            }
        }

        // 9. Trigger Event Architecture (Asynchronous)
        await triggerAutomationFlow({
            workspaceId,
            contactId: result.contact.id,
            event: "BOOKING_CREATED",
            payload: {
                bookingId: result.booking.id,
                serviceName: result.service.name
            }
        });

        // 10. Schedule Reminder Job (Step 4.5)
        // Store in ScheduledJob table for cron worker processing
        const reminderTime = new Date(new Date(dateTime).getTime() - 24 * 60 * 60 * 1000);
        await prisma.scheduledJob.create({
            data: {
                workspaceId,
                type: "REMINDER_24H",
                executeAt: reminderTime,
                payload: {
                    bookingId: result.booking.id,
                    contactId: result.contact.id,
                    serviceName: result.service.name
                }
            }
        });

        // 11. Audit: Document Scheduled Reminders
        await prisma.auditLog.create({
            data: {
                workspaceId,
                action: "REMINDER_SCHEDULED",
                entity: "Booking",
                entityId: result.booking.id,
                metadata: { scheduleDate: reminderTime }
            }
        });

        return { success: true, bookingId: result.booking.id };

    } catch (error) {
        console.error("[BOOKING-ENGINE-FAILURE]", error.message);
        return { error: error.message || "We couldn't complete your booking. Please try again or contact us for assistance." };
    }
}
