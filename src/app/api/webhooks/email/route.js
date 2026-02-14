import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * EMAIL WEBHOOK HANDLER
 * Unified gateway for receiving customer replies via email providers (SendGrid, Mailgun, etc.)
 */
export async function POST(req) {
    try {
        const contentType = req.headers.get("content-type") || "";
        let data = {};

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            data = Object.fromEntries(formData);
        } else {
            data = await req.json();
        }

        // Abstracting provider-specific logic
        // Most providers send headers in a specific field
        // SendGrid/Mailgun often put headers in 'email' or separate keys
        const conversationId = data['X-Conversation-ID'] || data['x-conversation-id'];
        let sender = data.from || data.sender || "";

        // Extract email from "Name <email>" format if present
        const emailMatch = sender.match(/<([^>]+)>/);
        if (emailMatch) {
            sender = emailMatch[1];
        }
        sender = sender.trim();

        const subject = data.subject;
        const content = data.text || data.html || data.body;

        if (!sender || !content) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        let conversation;

        if (conversationId) {
            conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: { contact: true }
            });
        }

        // Fallback: Match by email if header is missing or invalid
        if (!conversation) {
            const contact = await prisma.contact.findFirst({
                where: { email: sender },
                include: {
                    conversations: {
                        orderBy: { updatedAt: 'desc' },
                        take: 1
                    }
                }
            });

            if (contact && contact.conversations.length > 0) {
                conversation = contact.conversations[0];
            } else if (contact) {
                // Create new conversation if none exists for this contact
                conversation = await prisma.conversation.create({
                    data: {
                        contactId: contact.id,
                        workspaceId: contact.workspaceId,
                        status: "ACTIVE"
                    }
                });
            }
        }

        if (!conversation) {
            console.error(`[RELAY-WEBHOOK] Could not route email from ${sender}`);
            return NextResponse.json({ error: "Routing failure" }, { status: 404 });
        }

        // Record the incoming message
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                content: content.substring(0, 5000), // Safety truncation
                sender: "CUSTOMER",
                channel: "EMAIL",
                metadata: data // Store full payload for safety
            }
        });

        // Update conversation heartbeat
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessageAt: new Date(),
                status: "ACTIVE",
                staffReplied: false // Reset flag so staff knows it needs attention
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[EMAIL-WEBHOOK-ERROR]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
