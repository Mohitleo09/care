"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getContactForms(contactId) {
    if (!contactId) return null;

    try {
        const contact = await prisma.contact.findUnique({
            where: { id: contactId },
            include: {
                bookings: {
                    include: {
                        serviceType: true,
                        forms: {
                            include: {
                                formTemplate: true,
                                submission: true
                            }
                        }
                    },
                    orderBy: { dateTime: 'desc' },
                    take: 5
                }
            }
        });

        if (!contact) return null;

        // Flatten all forms from all bookings for the portal
        const allForms = contact.bookings.flatMap(booking =>
            booking.forms.map(instance => ({
                id: instance.id,
                name: instance.formTemplate.name,
                status: instance.status,
                isCompleted: !!instance.submission,
                bookingDate: booking.dateTime,
                serviceName: booking.serviceType.name,
                fields: instance.formTemplate.fields
            }))
        );

        return {
            contact: {
                id: contact.id,
                name: contact.name,
                email: contact.email
            },
            forms: allForms
        };
    } catch (error) {
        console.error("[GET-CONTACT-FORMS-ERROR]", error);
        return null;
    }
}

export async function submitPortalForm(formData) {
    const contactId = formData.get("contactId");
    const formId = formData.get("formId");
    const data = JSON.parse(formData.get("data"));

    try {
        await prisma.formSubmission.create({
            data: {
                contactId,
                postBookingFormId: formId,
                data
            }
        });

        revalidatePath(`/portal/${contactId}`);
        return { success: true };
    } catch (error) {
        console.error("Portal Form Error:", error);
        return { error: "Failed to submit form node." };
    }
}
