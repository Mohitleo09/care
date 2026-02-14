"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import { Twilio } from "twilio";
import crypto from "crypto";

const STEP_TITLES = {
    1: "Workspace Identity",
    2: "Communication Gateway",
    3: "Customer Gateway",
    4: "Service Portfolio",
    5: "Document Protocol",
    6: "Resource Logistics",
    7: "Team Personnel",
    8: "Final Activation"
};

export async function createWorkspace(formData) {
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const timezone = formData.get("timezone");
    const address = formData.get("address");

    if (!name || !email || !password) {
        return { error: "Organization Name, Admin Email, and Passkey are required." };
    }

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
            include: {
                workspace: {
                    include: {
                        channels: true,
                        contactForms: true,
                        serviceTypes: {
                            include: { availability: true }
                        },
                        formTemplates: true,
                        inventory: true,
                        users: true
                    }
                }
            }
        });

        if (existingUser) {
            // If the workspace is already active, they should login
            if (existingUser.workspace?.isActive) {
                return { error: "This business is already active. Please sign in to your dashboard." };
            }

            // Return full data for state hydration
            return {
                success: true,
                workspaceId: existingUser.workspaceId,
                existing: true,
                onboardingStep: existingUser.workspace?.onboardingStep || 2,
                data: {
                    orgData: {
                        name: existingUser.workspace.name,
                        email: existingUser.workspace.contactEmail,
                        timezone: existingUser.workspace.timezone,
                        address: existingUser.workspace.address
                    },
                    channels: existingUser.workspace.channels,
                    contactForms: existingUser.workspace.contactForms,
                    serviceTypes: existingUser.workspace.serviceTypes,
                    formTemplates: existingUser.workspace.formTemplates,
                    inventory: existingUser.workspace.inventory,
                    team: existingUser.workspace.users
                }
            };
        }

        const hashedPassword = await hash(password, 12);

        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

        // Created as "Not Activated" by default - Ensuring new schema is loaded
        const workspace = await prisma.workspace.create({
            data: {
                name,
                slug: `${slug}-${crypto.randomBytes(3).toString('hex')}`,
                contactEmail: email,
                timezone: timezone || "UTC",
                address,
                isActive: false, // Default = Not Activated
                onboardingStep: 2,
                users: {
                    create: {
                        email,
                        name: name.split(' ')[0] + " Admin",
                        password: hashedPassword,
                        role: "OWNER"
                    }
                }
            },
            include: {
                users: true
            }
        });

        return { success: true, workspaceId: workspace.id };

    } catch (error) {
        console.error("Failed to create workspace:", error);
        return { error: "Failed to provision workspace. Please try again." };
    }
}

export async function verifyEmailConnection(config) {
    try {
        const { host, port, user, pass, secure } = config;
        const transporter = nodemailer.createTransport({
            host,
            port: parseInt(port) || 587,
            secure: secure || false,
            auth: { user, pass },
        });

        await transporter.verify();
        return { success: true };
    } catch (error) {
        console.error("Email verification failed:", error);
        return { error: error.message || "Failed to authenticate with SMTP server." };
    }
}

export async function verifySmsConnection(config) {
    try {
        const { sid, token } = config;
        const client = new Twilio(sid, token);
        await client.api.accounts(sid).fetch();
        return { success: true };
    } catch (error) {
        console.error("SMS verification failed:", error);
        return { error: error.message || "Failed to authenticate with Twilio." };
    }
}

export async function updateWorkspaceConfig(workspaceId, step, data) {
    try {
        switch (step) {
            case 2: // Communication Gateway (User Step 3)
                if (data.channels && data.channels.length > 0) {
                    await prisma.communicationChannel.deleteMany({ where: { workspaceId } });
                    await prisma.communicationChannel.createMany({
                        data: data.channels.map(ch => ({
                            ...ch,
                            workspaceId
                        }))
                    });
                } else {
                    return { error: "At least one communication channel is required for activation." };
                }
                break;
            case 3: // Contact Form Configuration
                if (!data.emailRequired && !data.phoneRequired) {
                    return { error: "At least one contact method (Email or Phone) must be required." };
                }
                await prisma.contactForm.deleteMany({ where: { workspaceId } });
                await prisma.contactForm.create({
                    data: {
                        name: data.name || "Main Gateway",
                        slug: `connect-leads-${workspaceId.substring(0, 6)}`,
                        settings: {
                            emailRequired: data.emailRequired,
                            phoneRequired: data.phoneRequired,
                            autoMessage: data.autoMessage,
                            channelPriority: data.channelPriority,
                            isPublished: true
                        },
                        workspaceId
                    }
                });
                break;
            case 4: // Resource Logistics (Step 4)
                if (data.inventory && data.inventory.length > 0) {
                    await prisma.inventoryItem.deleteMany({ where: { workspaceId } });
                    await prisma.inventoryItem.createMany({
                        data: data.inventory.map(i => ({
                            name: i.name,
                            type: i.type || "CONSUMABLE",
                            totalQuantity: parseInt(i.quantity) || 1,
                            availableQuantity: parseInt(i.quantity) || 1,
                            lowStockThreshold: i.type === 'REUSABLE' ? 0 : (parseInt(i.threshold) || 0),
                            workspaceId
                        }))
                    });
                }
                break;
            case 5: // Service Portfolio (Step 5)
                if (data.services && data.services.length > 0) {
                    // Clean start for workspace services - delete dependencies first
                    await prisma.serviceAvailability.deleteMany({ where: { serviceType: { workspaceId } } });
                    await prisma.bookingTypeForm.deleteMany({ where: { serviceType: { workspaceId } } });
                    await prisma.serviceResource.deleteMany({ where: { serviceType: { workspaceId } } });
                    await prisma.serviceType.deleteMany({ where: { workspaceId } });

                    // Fetch inventory items to map names to IDs
                    const inventoryItems = await prisma.inventoryItem.findMany({ where: { workspaceId } });

                    for (const s of data.services) {
                        const serviceSlug = s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                        const service = await prisma.serviceType.create({
                            data: {
                                workspaceId,
                                name: s.name,
                                slug: `${serviceSlug}-${workspaceId.substring(0, 4)}`,
                                description: s.description,
                                duration: parseInt(s.duration) || 30,
                                bufferTime: parseInt(s.bufferTime) || 0,
                                isActive: true, // Activated by default during onboarding
                                locationType: s.locationType || "ONLINE",
                                location: s.location || "",
                                availability: {
                                    create: Object.entries(s.availability || {})
                                        .filter(([_, config]) => config.active)
                                        .map(([day, config]) => ({
                                            dayOfWeek: day.charAt(0).toUpperCase() + day.slice(1),
                                            startTime: config.start || "09:00",
                                            endTime: config.end || "17:00"
                                        }))
                                }
                            }
                        });

                        // Link resources
                        if (s.resourceRequirements && s.resourceRequirements.length > 0) {
                            for (const req of s.resourceRequirements) {
                                const item = inventoryItems.find(i => i.name === req.name);
                                if (item) {
                                    await prisma.serviceResource.create({
                                        data: {
                                            serviceTypeId: service.id,
                                            inventoryItemId: item.id,
                                            quantity: parseInt(req.quantity) || 1
                                        }
                                    });
                                }
                            }
                        }
                    }
                } else {
                    return { error: "At least one booking type is required to drive revenue engine." };
                }

                // Activate workspace as soon as services are defined
                await prisma.workspace.update({
                    where: { id: workspaceId },
                    data: { isActive: true }
                });
                break;
            case 6: // Document Protocol (Step 6)
                if (data.forms && data.forms.length > 0) {
                    await prisma.bookingTypeForm.deleteMany({ where: { formTemplate: { workspaceId } } });
                    await prisma.formTemplate.deleteMany({ where: { workspaceId } });

                    for (const f of data.forms) {
                        const template = await prisma.formTemplate.create({
                            data: {
                                workspaceId,
                                name: f.name,
                                description: f.description || "Standard intake protocol",
                                fields: f.fields || [],
                            }
                        });

                        const services = await prisma.serviceType.findMany({ where: { workspaceId } });
                        for (const s of services) {
                            await prisma.bookingTypeForm.create({
                                data: {
                                    serviceTypeId: s.id,
                                    formTemplateId: template.id,
                                    isRequired: true
                                }
                            });
                        }
                    }
                }
                break;
            case 7: // Team Personnel (User Step 8)
                if (data.staff && data.staff.length > 0) {
                    // Clean start for team (except owner) to avoid unique email conflicts
                    await prisma.user.deleteMany({
                        where: {
                            workspaceId,
                            role: { not: "OWNER" }
                        }
                    });

                    // Fetch workspace name and email config for invitation
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

                    let transporter = null;
                    let smtpUser = config?.user;
                    if (config && config.user && config.pass) {
                        const { host, port, user, pass, secure } = config;
                        console.log(`[STAFF-INVITE] Initializing transporter for ${user}`);
                        transporter = nodemailer.createTransport({
                            host: host || "smtp.gmail.com",
                            port: parseInt(port) || 587,
                            secure: secure || false,
                            auth: { user, pass },
                            tls: { rejectUnauthorized: false }
                        });
                    } else {
                        console.log("[STAFF-INVITE] No email config found! Skipping invites.");
                    }

                    for (const member of data.staff) {
                        const setupToken = crypto.randomBytes(32).toString("hex");
                        const setupTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

                        await prisma.user.create({
                            data: {
                                name: member.name,
                                email: member.email,
                                role: member.role || "STAFF",
                                setupToken,
                                setupTokenExpires,
                                workspaceId,
                            }
                        });

                        if (transporter) {
                            try {
                                await transporter.sendMail({
                                    from: smtpUser,
                                    to: member.email,
                                    subject: `You've been invited to join ${workspace.name}`,
                                    html: `
                                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #F1F5F9; border-radius: 24px; background-color: #FFFFFF; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                                            <div style="margin-bottom: 32px; text-align: center;">
                                                <div style="display: inline-block; padding: 12px; background-color: #0F172A; border-radius: 12px;">
                                                    <span style="color: white; font-weight: bold; font-size: 20px;">CareOps</span>
                                                </div>
                                            </div>
                                            <h2 style="color: #0F172A; font-size: 24px; font-weight: 800; margin-bottom: 16px; text-align: center;">Welcome to the Team</h2>
                                            <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 32px;">
                                                Hello ${member.name}, you've been invited by <strong>${workspace.name}</strong> to join their workspace as a <strong>${member.role === 'ADMIN' ? 'System Administrator' : 'Staff Member'}</strong>.
                                            </p>
                                            
                                            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                                                <p style="margin: 0 0 16px 0; color: #64748B; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Your Invitation Details</p>
                                                <div style="margin-bottom: 12px;">
                                                    <span style="color: #94A3B8; font-size: 14px;">Email:</span>
                                                    <span style="color: #0F172A; font-size: 14px; font-weight: 600; margin-left: 8px;">${member.email}</span>
                                                </div>
                                                <div>
                                                    <span style="color: #94A3B8; font-size: 14px;">Role:</span>
                                                    <span style="color: #0F172A; font-size: 14px; font-weight: 600; margin-left: 8px;">${member.role === 'ADMIN' ? 'System Admin' : 'Staff'}</span>
                                                </div>
                                            </div>

                                            <div style="text-align: center; margin-bottom: 32px;">
                                                <a href="${process.env.NEXTAUTH_URL}/setup-password?token=${setupToken}" style="background-color: #0F172A; color: #FFFFFF; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s ease;">Claim Your Account</a>
                                            </div>

                                            <p style="color: #94A3B8; font-size: 13px; text-align: center; margin-top: 32px;">
                                                Security Note: This link will expire in 24 hours.
                                            </p>
                                        </div>
                                    `
                                });
                                console.log(`[STAFF-INVITE] Email sent successfully to ${member.email}`);
                            } catch (mailErr) {
                                console.error(`[STAFF-INVITE] Failed to send invite to ${member.email}:`, mailErr);
                            }
                        }
                    }
                }
                break;
            case 8: // Final Activation (User Step 9)
                const ws = await prisma.workspace.findUnique({
                    where: { id: workspaceId },
                    include: { channels: true, serviceTypes: true }
                });

                if (ws.channels.length === 0 || ws.serviceTypes.length === 0) {
                    return { error: "Valid communication channel and booking type required for activation." };
                }

                await prisma.workspace.update({
                    where: { id: workspaceId },
                    data: { isActive: true, onboardingStep: 9 }
                });
                break;
        }

        if (step < 8) {
            await prisma.workspace.update({
                where: { id: workspaceId },
                data: { onboardingStep: step + 1 }
            });
        }

        return { success: true };
    } catch (error) {
        console.error(`[ACTIONS_ERROR] Step ${step} failed for workspace ${workspaceId}: `, error);
        return {
            error: `Validation failed: ${STEP_TITLES[step] || 'Unknown configuration error'} `,
            details: error.message
        };
    }
}

export async function setupPassword(token, password) {
    if (!token || !password) return { error: "Missing required information." };

    // Server-side validation (Production requirement)
    if (password.length < 8) {
        return { error: "Password must be at least 8 characters long." };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { setupToken: token }
        });

        if (!user || !user.setupTokenExpires || user.setupTokenExpires < new Date()) {
            return { error: "This invitation link has expired or is invalid." };
        }

        const hashedPassword = await hash(password, 12);

        // Update user and invalidate token (Single-use security)
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                setupToken: null,
                setupTokenExpires: null
            }
        });

        return { success: true };
    } catch (error) {
        console.error("[SETUP_PASSWORD_ERROR]:", error);
        return { error: "Failed to update password. Please try again later." };
    }
}
