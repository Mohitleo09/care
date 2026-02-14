"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import crypto from "crypto";

/**
 * DASHBOARD ACTIONS
 * Centralized server actions for internal staff operations
 */

// Conversations & Messaging
export async function getConversations(workspaceId) {
    try {
        if (!workspaceId) {
            const { getServerSession } = require("next-auth");
            const { authOptions } = require("@/lib/auth-options");
            const session = await getServerSession(authOptions);
            workspaceId = session?.user?.workspaceId;
        }

        const conversations = await prisma.conversation.findMany({
            where: { workspaceId },
            include: {
                contact: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { lastMessageAt: 'desc' }
        });
        return conversations;
    } catch (error) {
        console.error("[GET-CONVERSATIONS]", error);
        return [];
    }
}

export async function getInventory(workspaceId) {
    try {
        if (!workspaceId) {
            const { getServerSession } = require("next-auth");
            const { authOptions } = require("@/lib/auth-options");
            const session = await getServerSession(authOptions);
            workspaceId = session?.user?.workspaceId;
        }

        const items = await prisma.inventoryItem.findMany({
            where: { workspaceId },
            orderBy: { name: 'asc' }
        });
        return items;
    } catch (error) {
        console.error("[GET-INVENTORY]", error);
        return [];
    }
}

export async function createInventoryItem(formData) {
    try {
        const { getServerSession } = require("next-auth");
        const { authOptions } = require("@/lib/auth-options");
        const session = await getServerSession(authOptions);
        const workspaceId = session?.user?.workspaceId;

        if (!workspaceId) return { error: "Unauthorized" };

        const name = formData.get("name");
        const type = formData.get("type"); // CONSUMABLE, ASSET
        const availableQuantity = parseInt(formData.get("availableQuantity"));
        const totalQuantity = parseInt(formData.get("totalQuantity"));
        const lowStockThreshold = parseInt(formData.get("lowStockThreshold"));

        if (!name || isNaN(availableQuantity)) {
            return { error: "Invalid data" };
        }

        await prisma.inventoryItem.create({
            data: {
                workspaceId,
                name,
                type,
                availableQuantity,
                totalQuantity: totalQuantity || availableQuantity,
                lowStockThreshold: lowStockThreshold || 0
            }
        });

        revalidatePath("/dashboard/inventory");
        return { success: true };
    } catch (error) {
        console.error("[CREATE-INVENTORY]", error);
        return { error: "Failed to create item" };
    }
}

export async function updateInventoryItem(formData) {
    try {
        const itemId = formData.get("id");
        const name = formData.get("name");
        const type = formData.get("type");
        const availableQuantity = parseInt(formData.get("availableQuantity"));
        const totalQuantity = parseInt(formData.get("totalQuantity"));
        const lowStockThreshold = parseInt(formData.get("lowStockThreshold"));

        if (!itemId || !name) return { error: "Invalid data" };

        await prisma.inventoryItem.update({
            where: { id: itemId },
            data: {
                name,
                type,
                availableQuantity,
                totalQuantity: totalQuantity || availableQuantity,
                lowStockThreshold: lowStockThreshold || 0
            }
        });

        revalidatePath("/dashboard/inventory");
        return { success: true };
    } catch (error) {
        console.error("[UPDATE-INVENTORY]", error);
        return { error: "Failed to update item" };
    }
}

export async function getMessages(conversationId) {
    try {
        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' }
        });
        return messages;
    } catch (error) {
        console.error("[GET-MESSAGES]", error);
        return [];
    }
}

export async function sendMessage(formData) {
    const isFormData = formData instanceof FormData;
    const conversationId = isFormData ? formData.get("conversationId") : formData.conversationId;
    const content = isFormData ? formData.get("content") : formData.content;

    if (!conversationId || !content) {
        return { error: "Message content required" };
    }

    try {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                contact: true,
                workspace: {
                    include: {
                        channels: { where: { isActive: true } }
                    }
                }
            }
        });

        if (!conversation) return { error: "Thread not found" };

        // 1. Determine Channel (Prefer EMAIL if available, else SMS)
        const preferredChannel = conversation.contact.email ? "EMAIL" : (conversation.contact.phone ? "SMS" : null);

        if (!preferredChannel) {
            return { error: "No contact method available for this user." };
        }

        const channelConfig = conversation.workspace.channels.find(c => c.type === preferredChannel);

        let externalId = null;

        if (preferredChannel === "EMAIL" && conversation.contact.email) {
            // Send External Email
            const emailConfig = channelConfig?.config || {
                host: "smtp.gmail.com",
                port: 587,
                user: process.env.email_user,
                pass: process.env.app_password,
                secure: false
            };

            const transporter = nodemailer.createTransport({
                host: emailConfig.host,
                port: parseInt(emailConfig.port),
                secure: emailConfig.secure,
                auth: { user: emailConfig.user, pass: emailConfig.pass },
                tls: { rejectUnauthorized: false }
            });

            const messageId = `<${crypto.randomBytes(16).toString('hex')}@${conversation.workspace.name.replace(/\s+/g, '').toLowerCase()}.careops.ai>`;

            await transporter.sendMail({
                from: `"${conversation.workspace.name}" <${emailConfig.user}>`,
                to: conversation.contact.email,
                subject: `New message from ${conversation.workspace.name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 8px;">
                        <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <h2 style="color: #0f172a; margin-top: 0; font-size: 18px; margin-bottom: 16px;">${conversation.workspace.name} says:</h2>
                            
                            <div style="color: #334155; font-size: 16px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 24px;">${content}</div>
                            
                            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8;">
                                <p style="margin: 0;">Reply directly to this email to respond.</p>
                                <p style="margin: 4px 0 0 0;">Powered by <strong>CareOps</strong></p>
                            </div>
                        </div>
                    </div>
                `,
                headers: {
                    "X-Conversation-ID": conversation.id,
                    "X-Workspace-ID": conversation.workspaceId
                }
            });
            externalId = messageId;
        } else if (preferredChannel === "SMS" && conversation.contact.phone) {
            // Send External SMS (Placeholder for Twilio/SNS)
            console.log(`[RELAY-SMS] To: ${conversation.contact.phone} | Content: ${content}`);
            externalId = `sms_${crypto.randomBytes(8).toString('hex')}`;
            // Twilio logic would go here: await client.messages.create({ body: content, to: phone, from: twilioPhone });
        }

        // 2. Record Message
        await prisma.message.create({
            data: {
                conversationId,
                content,
                sender: "STAFF",
                channel: preferredChannel,
                externalId: externalId
            }
        });

        // 3. Update Conversation State
        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                lastMessageAt: new Date(),
                status: "ACTIVE",
                staffReplied: true
            }
        });

        // ... (existing sendMessage code) ...
        revalidatePath("/dashboard/inbox");
        return { success: true };
    } catch (error) {
        console.error("[SEND-MESSAGE]", error);
        return { error: "Transport layer failure. Check connectivity settings." };
    }
}

export async function simulateIncomingReply(conversationId, content) {
    try {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: true }
        });

        if (!conversation) return { error: "Conversation not found" };

        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                content: content,
                sender: "CUSTOMER", // Simulating customer reply
                channel: "EMAIL",
                metadata: { source: "simulation" }
            }
        });

        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                lastMessageAt: new Date(),
                status: "ACTIVE",
                staffReplied: false // Reset flag so staff sees it needs attention
            }
        });

        revalidatePath("/dashboard/inbox");
        return { success: true };
    } catch (error) {
        console.error("[SIMULATE-REPLY]", error);
        return { error: "Simulation failed" };
    }
}

// Bookings Management
export async function getBookings(workspaceId, filters = {}) {
    try {
        if (!workspaceId) {
            const { getServerSession } = require("next-auth");
            const { authOptions } = require("@/lib/auth-options");
            const session = await getServerSession(authOptions);
            workspaceId = session?.user?.workspaceId;
        }

        const bookings = await prisma.booking.findMany({
            where: {
                serviceType: { workspaceId },
                ...filters
            },
            include: {
                contact: true,
                serviceType: true,
                forms: {
                    include: {
                        formTemplate: true
                    }
                }
            },
            orderBy: { dateTime: 'asc' }
        });
        return JSON.parse(JSON.stringify(bookings, (key, value) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                if (value.constructor?.name === 'Decimal' || typeof value.toFixed === 'function' || ('d' in value && 'e' in value && 's' in value)) {
                    return value.toString();
                }
            }
            return value;
        }));
    } catch (error) {
        console.error("[GET-BOOKINGS]", error);
        return [];
    }
}

export async function updateBookingStatus(formData) {
    const bookingId = formData instanceof FormData ? formData.get("bookingId") : formData.bookingId;
    const status = formData instanceof FormData ? formData.get("status") : formData.status;

    try {
        await prisma.booking.update({
            where: { id: bookingId },
            data: { status }
        });

        revalidatePath("/dashboard/bookings");
        return { success: true };
    } catch (error) {
        console.error("[UPDATE-BOOKING]", error);
        return { error: "Failed to update booking status" };
    }
}

export async function getFormSubmission(formInstanceId) {
    try {
        const submission = await prisma.formSubmission.findUnique({
            where: { formInstanceId },
            include: {
                formInstance: {
                    include: {
                        formTemplate: true,
                        booking: {
                            include: {
                                contact: true
                            }
                        }
                    }
                }
            }
        });
        return submission;
    } catch (error) {
        console.error("[GET-FORM-SUBMISSION]", error);
        return null;
    }
}

// Team Management
export async function getTeam(workspaceId) {
    try {
        // If no workspaceId provided, get from session
        if (!workspaceId) {
            const { getServerSession } = require("next-auth");
            const { authOptions } = require("@/lib/auth-options");
            const session = await getServerSession(authOptions);
            workspaceId = session?.user?.workspaceId;
        }

        const team = await prisma.user.findMany({
            where: { workspaceId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                password: true,
                createdAt: true
            },
            orderBy: { createdAt: 'asc' }
        });
        return team;
    } catch (error) {
        console.error("[GET-TEAM]", error);
        return [];
    }
}

export async function inviteUser(formData) {
    const isFormData = formData instanceof FormData;
    let workspaceId = isFormData ? formData.get("workspaceId") : formData.workspaceId;
    const email = isFormData ? formData.get("email") : formData.email;
    const name = isFormData ? formData.get("name") : formData.name;
    const role = (isFormData ? formData.get("role") : formData.role) || "STAFF";

    // If no workspaceId provided, get from session
    if (!workspaceId) {
        const { getServerSession } = require("next-auth");
        const { authOptions } = require("@/lib/auth-options");
        const session = await getServerSession(authOptions);
        workspaceId = session?.user?.workspaceId;
    }

    try {
        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return { error: "A user with this email already exists" };
        }

        // Generate setup token for password creation
        const setupToken = crypto.randomBytes(32).toString("hex");
        const setupTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const user = await prisma.user.create({
            data: {
                workspaceId,
                email,
                name,
                role,
                setupToken,
                setupTokenExpires
            }
        });

        // Send invitation email
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                channels: {
                    where: { type: "EMAIL", isActive: true }
                }
            }
        });

        const emailChannel = workspace?.channels[0];
        const config = emailChannel?.config || {
            host: "smtp.gmail.com",
            port: 587,
            user: process.env.email_user,
            pass: process.env.app_password,
            secure: false
        };

        if (config && config.user && config.pass) {
            const { host, port, user: smtpUser, pass, secure } = config;
            console.log(`[DASH-MAIL] Staff invite attempt for ${email} via ${smtpUser}`);
            const transporter = nodemailer.createTransport({
                host: host || "smtp.gmail.com",
                port: parseInt(port) || 587,
                secure: secure || false,
                auth: { user: smtpUser, pass },
                tls: { rejectUnauthorized: false }
            });

            try {
                await transporter.verify();
                await transporter.sendMail({
                    from: smtpUser,
                    to: email,
                    subject: `Welcome to ${workspace.name}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px;">
                            <h2 style="color: #0F172A;">Welcome to the Team!</h2>
                            <p>Hi ${name},</p>
                            <p>You've been invited to join <strong>${workspace.name}</strong> as a ${role === 'OWNER' ? 'Administrator' : 'Staff Member'}.</p>
                            <p>Click the button below to set up your password and access your dashboard:</p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${process.env.NEXTAUTH_URL}/setup-password?token=${setupToken}" 
                                   style="background-color: #0F172A; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block;">
                                    Set Up Your Account
                                </a>
                            </div>
                            <p style="color: #64748B; font-size: 14px;">This link will expire in 7 days.</p>
                        </div>
                    `
                });
            } catch (mailErr) {
                console.error(`Failed to send invite to ${email}:`, mailErr);
            }
        }

        revalidatePath("/dashboard/team");
        return { success: true, userId: user.id };
    } catch (error) {
        console.error("[INVITE-USER]", error);
        return { error: "Failed to send invitation" };
    }
}

export async function removeMember(userId) {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return { error: "User not found" };
        }

        if (user.role === 'OWNER') {
            return { error: "Cannot remove the workspace owner" };
        }

        await prisma.user.delete({ where: { id: userId } });

        revalidatePath("/dashboard/team");
        return { success: true };
    } catch (error) {
        console.error("[REMOVE-MEMBER]", error);
        return { error: "Failed to remove team member" };
    }
}

export async function resendInvitation(userId) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { workspace: { include: { channels: { where: { type: "EMAIL", isActive: true } } } } }
        });

        if (!user) {
            return { error: "User not found" };
        }

        if (user.password) {
            return { error: "This user has already set up their account" };
        }

        // Generate new setup token
        const setupToken = crypto.randomBytes(32).toString("hex");
        const setupTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await prisma.user.update({
            where: { id: userId },
            data: { setupToken, setupTokenExpires }
        });

        // Resend email
        const emailChannel = user.workspace?.channels[0];
        const config = emailChannel?.config || {
            host: "smtp.gmail.com",
            port: 587,
            user: process.env.email_user,
            pass: process.env.app_password,
            secure: false
        };

        if (config && config.user && config.pass) {
            const { host, port, user: smtpUser, pass, secure } = config;
            console.log(`[DASH-MAIL] Resending invite to ${user.email} via ${smtpUser}`);
            const transporter = nodemailer.createTransport({
                host: host || "smtp.gmail.com",
                port: parseInt(port) || 587,
                secure: secure || false,
                auth: { user: smtpUser, pass },
                tls: { rejectUnauthorized: false }
            });

            try {
                await transporter.verify();
                await transporter.sendMail({
                    from: smtpUser,
                    to: user.email,
                    subject: `Reminder: Set up your ${user.workspace.name} account`,
                    html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px;">
                        <h2 style="color: #0F172A;">Complete Your Account Setup</h2>
                        <p>Hi ${user.name},</p>
                        <p>This is a reminder to complete your account setup for <strong>${user.workspace.name}</strong>.</p>
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${process.env.NEXTAUTH_URL}/setup-password?token=${setupToken}" 
                               style="background-color: #0F172A; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block;">
                                Set Up Your Password
                            </a>
                        </div>
                        <p style="color: #64748B; font-size: 14px;">This link will expire in 7 days.</p>
                    </div>
                `
                });
            } catch (mailErr) {
                console.error(`[DASH-MAIL] Failed to resend invite to ${user.email}:`, mailErr);
            }
        }

        revalidatePath("/dashboard/team");
        return { success: true };
    } catch (error) {
        console.error("[RESEND-INVITATION]", error);
        return { error: "Failed to resend invitation" };
    }
}

export async function getDashboardOverview(workspaceId) {
    try {
        if (!workspaceId) {
            const { getServerSession } = require("next-auth");
            const { authOptions } = require("@/lib/auth-options");
            const session = await getServerSession(authOptions);
            workspaceId = session?.user?.workspaceId;

            if (!workspaceId) {
                console.error("[GET-DASHBOARD] No workspace context found in session");
                throw new Error("Session invalid or expired");
            }
        }

        const now = new Date();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

        const [
            bookingsToday,
            bookingsUpcoming,
            bookingsNoShow,
            bookingsCompletedByLead,
            unansweredConversations,
            newLeadsToday,
            overdueForms,
            allInventory,
            futureBookings,
            recentNotifications
        ] = await Promise.all([
            // 1. Booking Breakdown
            prisma.booking.findMany({
                where: {
                    serviceType: { workspaceId },
                    dateTime: { gte: todayStart, lt: todayEnd }
                }
            }),
            prisma.booking.count({
                where: {
                    serviceType: { workspaceId },
                    dateTime: { gte: todayEnd },
                    status: "CONFIRMED"
                }
            }),
            prisma.booking.count({
                where: {
                    serviceType: { workspaceId },
                    status: "NOSHOW"
                }
            }),
            prisma.booking.count({
                where: {
                    serviceType: { workspaceId },
                    status: "COMPLETED"
                }
            }),

            // 2. Conversation Health
            prisma.conversation.findMany({
                where: {
                    workspaceId,
                    staffReplied: false,
                    status: "ACTIVE"
                },
                include: {
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    },
                    contact: true
                }
            }),

            // 3. Lead Velocity
            prisma.contact.count({
                where: {
                    workspaceId,
                    createdAt: { gte: todayStart }
                }
            }),

            // 4. Form Status (Pending & Overdue check)
            prisma.formInstance.findMany({
                where: {
                    status: "PENDING",
                    // Fetch all pending forms to differentiate between overdue and just pending
                },
                include: {
                    booking: { include: { contact: true } },
                    formTemplate: true
                }
            }),

            // 5. Inventory State
            prisma.inventoryItem.findMany({ where: { workspaceId } }),

            // 6. Future Bookings (for Stockout Simulation)
            prisma.booking.findMany({
                where: {
                    dateTime: { gte: now },
                    status: "CONFIRMED",
                    serviceType: { workspaceId }
                },
                include: {
                    serviceType: {
                        include: {
                            resources: { include: { inventoryItem: true } }
                        }
                    }
                },
                orderBy: { dateTime: 'asc' }
            }),

            // 7. Internal Notifications
            prisma.internalNotification.findMany({
                where: { isRead: false },
                orderBy: { createdAt: 'desc' },
                take: 10
            })
        ]);

        // --- CALCULATION LOGIC ---

        // A. Booking Categories
        const todayStats = {
            total: bookingsToday.length,
            confirmed: bookingsToday.filter(b => b.status === 'CONFIRMED').length,
            pending: bookingsToday.filter(b => b.status === 'PENDING').length
        };

        // B. Unanswered Content Filtering
        // Only count as unanswered if the LAST message was from CUSTOMER
        const trulyUnanswered = unansweredConversations.filter(c =>
            c.messages.length > 0 && c.messages[0].sender === 'CUSTOMER'
        );

        // C. Operational Hazard Simulation (Stockouts)
        const inventoryStock = {};
        const hazards = [];
        allInventory.forEach(i => inventoryStock[i.id] = { name: i.name, qty: i.availableQuantity, type: i.type });

        for (const booking of futureBookings) {
            for (const res of booking.serviceType.resources) {
                if (res.inventoryItem.type === 'CONSUMABLE') {
                    inventoryStock[res.inventoryItemId].qty -= res.quantity;
                    if (inventoryStock[res.inventoryItemId].qty < 0) {
                        hazards.push({
                            id: `hazard-${booking.id}-${res.inventoryItemId}`,
                            type: 'risk',
                            title: 'Operational Hazard',
                            desc: `Booking on ${new Date(booking.dateTime).toLocaleDateString()} will fail: ${res.inventoryItem.name} depleted.`,
                            time: 'Critical',
                            priority: 'critical'
                        });
                        inventoryStock[res.inventoryItemId].qty = -999;
                    }
                }
            }
        }

        // D. Alert Construction
        const alerts = [
            ...hazards.slice(0, 3),
            ...trulyUnanswered.map(c => ({
                id: `msg-${c.id}`,
                type: 'message',
                title: 'Staff Missed Message',
                desc: `${c.contact.name} is waiting for a reply since ${new Date(c.messages[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
                time: 'Unanswered',
                priority: 'high',
                link: '/dashboard/inbox'
            })),
            ...overdueForms.map(f => {
                const isOverdue = new Date(f.dueDate) < now;
                return {
                    id: `form-${f.id}`,
                    type: 'compliance',
                    title: isOverdue ? 'Compliance Overdue' : 'Form Pending',
                    desc: `${f.booking.contact.name} needs to complete: ${f.formTemplate.name}.`,
                    time: isOverdue ? 'Overdue' : 'Waiting',
                    priority: isOverdue ? 'critical' : 'normal',
                    formInstanceId: f.id,
                    contactName: f.booking.contact.name,
                    link: `/dashboard/bookings`
                };
            }),
            ...allInventory.filter(i => i.type === 'CONSUMABLE' && i.availableQuantity <= i.lowStockThreshold).map(i => ({
                id: `inv-${i.id}`,
                type: 'inventory',
                title: `${i.availableQuantity === 0 ? 'CRITICAL: Out of Stock' : 'Low Stock Alert'}`,
                desc: `${i.name} has ${i.availableQuantity} units left. Reorder recommended.`,
                time: i.availableQuantity === 0 ? 'Urgent' : 'Soon',
                priority: i.availableQuantity === 0 ? 'critical' : 'high',
                link: '/dashboard/inventory'
            }))
        ].sort((a, b) => {
            const weight = { 'critical': 3, 'high': 2, 'normal': 1 };
            return (weight[b.priority] || 0) - (weight[a.priority] || 0);
        });

        const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });

        // --- RETURN DATA STRUCTURE ---
        return {
            workspace,
            greeting: `Good ${now.getHours() < 12 ? 'morning' : 'afternoon'}, Owner.`,
            stats: [
                {
                    label: "Today's Pulse",
                    value: todayStats.confirmed.toString(),
                    trend: `${todayStats.pending} pending`,
                    icon: "Calendar",
                    color: "text-blue-500",
                    subLabel: "Confirmed Bookings"
                },
                {
                    label: "Support Load",
                    value: trulyUnanswered.length.toString(),
                    trend: `${unansweredConversations.length} total active`,
                    icon: "MessageSquare",
                    color: "text-indigo-500",
                    subLabel: "Unanswered"
                },
                {
                    label: "Lead Flow",
                    value: newLeadsToday.toString(),
                    trend: "Last 24h",
                    icon: "Activity",
                    color: "text-teal-500",
                    subLabel: "New Inquiries"
                },
                {
                    label: "Compliance",
                    value: overdueForms.filter(f => new Date(f.dueDate) < now).length.toString(),
                    trend: `${overdueForms.length} pending total`,
                    icon: "FileText",
                    color: "text-rose-500",
                    subLabel: "Overdue Forms"
                },
            ],
            sections: {
                bookings: {
                    today: todayStats.total,
                    upcoming: bookingsUpcoming,
                    noshows: bookingsNoShow,
                    completed: bookingsCompletedByLead
                },
                inventory: {
                    lowStock: allInventory.filter(i => i.availableQuantity <= i.lowStockThreshold).length,
                    critical: allInventory.filter(i => i.availableQuantity === 0).length
                }
            },
            alerts
        };
    } catch (error) {
        console.error("[GET-DASHBOARD-OVERVIEW-FAILURE]", error);
        throw new Error("Operational Intelligence failure. Data feed interrupted.");
    }
}

export async function sendFormReminder(formInstanceId) {
    try {
        const formInstance = await prisma.formInstance.findUnique({
            where: { id: formInstanceId },
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

        if (!formInstance) {
            return { error: "Form not found" };
        }

        if (formInstance.status === "COMPLETED") {
            return { error: "This form has already been completed" };
        }

        const contact = formInstance.booking.contact;
        const workspace = await prisma.workspace.findFirst({
            where: { id: contact.workspaceId },
            include: {
                channels: {
                    where: { type: "EMAIL", isActive: true }
                }
            }
        });

        const emailChannel = workspace?.channels[0];
        const config = emailChannel?.config || {
            host: "smtp.gmail.com",
            port: 587,
            user: process.env.email_user,
            pass: process.env.app_password,
            secure: false
        };

        if (!config || !config.user || !config.pass) {
            return { error: "Email configuration unavailable" };
        }

        if (!contact.email) {
            return { error: "Patient does not have an email address" };
        }

        // Generate form access token (reuse existing token or create new one)
        const formToken = formInstance.accessToken || crypto.randomBytes(32).toString("hex");

        // Update form instance with token if it doesn't have one
        if (!formInstance.accessToken) {
            await prisma.formInstance.update({
                where: { id: formInstanceId },
                data: { accessToken: formToken }
            });
        }

        // Send email
        const { host, port, user: smtpUser, pass, secure } = config;
        console.log(`[DASH-MAIL] Sending form reminder to ${contact.email} via ${smtpUser}`);
        const transporter = nodemailer.createTransport({
            host: host || "smtp.gmail.com",
            port: parseInt(port) || 587,
            secure: secure || false,
            auth: { user: smtpUser, pass },
            tls: { rejectUnauthorized: false }
        });

        const formLink = `${process.env.NEXTAUTH_URL}/forms/${formToken}`;
        const appointmentDate = new Date(formInstance.booking.dateTime).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        await transporter.verify();
        await transporter.sendMail({
            from: smtpUser,
            to: contact.email,
            subject: `Action Required: Complete Your ${formInstance.formTemplate.name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px;">
                    <h2 style="color: #0F172A;">Complete Your Form</h2>
                    <p>Hi ${contact.name},</p>
                    <p>You have an upcoming appointment on <strong>${appointmentDate}</strong>.</p>
                    <p>To help us prepare for your visit, please complete the following form:</p>
                    <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0; font-weight: bold; color: #0F172A;">${formInstance.formTemplate.name}</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #64748B;">Required for your ${formInstance.booking.serviceType.name} appointment</p>
                    </div>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${formLink}" 
                           style="background-color: #0F172A; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                            Complete Form Now
                        </a>
                    </div>
                    <p style="color: #64748B; font-size: 14px;">This form should only take a few minutes to complete.</p>
                    <p style="color: #64748B; font-size: 14px;">If you have any questions, please don't hesitate to contact us.</p>
                    <p style="margin-top: 32px;">Best regards,<br>${workspace.name}</p>
                </div>
            `
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("[SEND-FORM-REMINDER]", error);
        return { error: "Failed to send reminder email" };
    }
}

export async function tempBootstrapPublicFlow() {
    try {
        console.log("🚀 Bootstrapping Public Flow...");

        // 1. Ensure Global Workspace
        let workspace = await prisma.workspace.findFirst({
            where: { slug: "care-center" }
        });

        if (!workspace) {
            workspace = await prisma.workspace.create({
                data: {
                    name: "Care Center",
                    slug: "care-center",
                    contactEmail: "hello@careops.ai",
                    isActive: true,
                    onboardingStep: 9
                }
            });
        }

        // 2. Add Services
        const serviceCount = await prisma.serviceType.count({
            where: { workspaceId: workspace.id }
        });

        if (serviceCount === 0) {
            const s1 = await prisma.serviceType.create({
                data: {
                    workspaceId: workspace.id,
                    name: "Virtual Consultation",
                    slug: "virtual-meet",
                    duration: 30,
                    isActive: true,
                    locationType: "ONLINE"
                }
            });

            const s2 = await prisma.serviceType.create({
                data: {
                    workspaceId: workspace.id,
                    name: "Clinic Visit",
                    slug: "clinic-visit",
                    duration: 60,
                    isActive: true,
                    locationType: "PHYSICAL"
                }
            });

            // 3. Add Basic Availability
            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
            for (const s of [s1, s2]) {
                for (const day of days) {
                    await prisma.availability.create({
                        data: {
                            serviceTypeId: s.id,
                            dayOfWeek: day,
                            startTime: "09:00",
                            endTime: "17:00"
                        }
                    });
                }
            }
        }

        return { success: true, slug: workspace.slug };
    } catch (error) {
        console.error("[BOOTSTRAP-ERROR]", error);
        return { error: error.message };
    }
}
