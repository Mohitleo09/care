"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * CONTACTS ACTIONS
 * CRM contact management operations
 */

export async function getContacts() {
    try {
        const { getServerSession } = require("next-auth");
        const { authOptions } = require("@/lib/auth-options");
        const session = await getServerSession(authOptions);
        const workspaceId = session?.user?.workspaceId;

        if (!workspaceId) return [];

        const contacts = await prisma.contact.findMany({
            where: { workspaceId },
            include: {
                conversations: {
                    include: {
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                },
                bookings: {
                    include: {
                        serviceType: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return contacts;
    } catch (error) {
        console.error("[GET-CONTACTS]", error);
        return [];
    }
}

export async function createContact(data) {
    try {
        const { getServerSession } = require("next-auth");
        const { authOptions } = require("@/lib/auth-options");
        const session = await getServerSession(authOptions);
        const workspaceId = session?.user?.workspaceId;

        if (!workspaceId) throw new Error("No active workspace found.");

        const { name, email, phone } = data;

        const contact = await prisma.contact.create({
            data: {
                workspaceId,
                name,
                email,
                phone
            }
        });

        revalidatePath("/dashboard/contacts");
        return { success: true, contactId: contact.id };
    } catch (error) {
        console.error("[CREATE-CONTACT]", error);
        return { error: error.message || "Failed to add contact." };
    }
}

export async function getContactDetails(contactId) {
    try {
        const contact = await prisma.contact.findUnique({
            where: { id: contactId },
            include: {
                conversations: {
                    include: {
                        messages: {
                            orderBy: { createdAt: 'asc' }
                        }
                    }
                },
                bookings: {
                    include: {
                        serviceType: true,
                        forms: {
                            include: {
                                formTemplate: true
                            }
                        }
                    },
                    orderBy: { dateTime: 'desc' }
                }
            }
        });
        return contact;
    } catch (error) {
        console.error("[GET-CONTACT-DETAILS]", error);
        return null;
    }
}
