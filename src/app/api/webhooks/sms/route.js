import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * SMS WEBHOOK HANDLER
 * Unified gateway for receiving customer replies via SMS providers (Twilio, MessageBird, etc.)
 */
export async function POST(req) {
    try {
        const data = await req.json();

        // Abstracting provider-specific logic (e.g. Twilio uses 'From' and 'Body')
        const from = data.From || data.from || data.sender;
        const body = data.Body || data.body || data.content;

        if (!from || !body) {
            return NextResponse.json({ error: "Invalid SMS payload" }, { status: 400 });
        }

        // Normalize phone number (handle different formats)
        const normalizedPhone = from.replace(/\D/g, '').slice(-10); // Simple normalize for demo

        // Identify Contact by Phone
        const contact = await prisma.contact.findFirst({
            where: {
                phone: { contains: normalizedPhone }
            },
            include: {
                conversations: {
                    orderBy: { updatedAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!contact) {
            console.error(`[SMS-RELAY] Unknown sender phone: ${from}`);
            return NextResponse.json({ error: "Contact not found" }, { status: 404 });
        }

        let conversation = contact.conversations[0];

        if (!conversation) {
            // Initiate new conversation if none exists
            conversation = await prisma.conversation.create({
                data: {
                    contactId: contact.id,
                    workspaceId: contact.workspaceId,
                    status: "ACTIVE"
                }
            });
        }

        // Store Message
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                content: body.trim(),
                sender: "CUSTOMER",
                channel: "SMS",
                metadata: data
            }
        });

        // Update Heatbeat
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessageAt: new Date(),
                status: "ACTIVE"
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[SMS-WEBHOOK-ERROR]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
