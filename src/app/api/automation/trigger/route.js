import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { event, data } = await req.json();

        switch (event) {
            case "NEW_CONTACT":
                // 1. Create Conversation
                const conversation = await prisma.conversation.create({
                    data: {
                        contactId: data.contactId,
                        workspaceId: data.workspaceId,
                    }
                });

                // 2. Send Automated Welcome Message
                await prisma.message.create({
                    data: {
                        conversationId: conversation.id,
                        sender: "SYSTEM",
                        content: "Welcome to our workspace! How can we assist you today?",
                        channel: data.preferredChannel || "EMAIL",
                    }
                });
                break;

            case "BOOKING_CREATED":
                // 1. Send Confirmation Message
                await prisma.message.create({
                    data: {
                        conversationId: data.conversationId,
                        sender: "AUTO",
                        content: `Booking Confirmed for ${data.dateTime}. We've sent the intake forms to your inbox.`,
                        channel: "EMAIL",
                    }
                });
                break;

            case "INVENTORY_LOW":
                // Logic for inventory alerts would go here
                break;

            default:
                console.log("Unknown event type:", event);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Automation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
