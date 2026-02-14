export const dynamic = "force-dynamic";
import { getContactForms } from "../portal-actions";
import PortalClient from "./portal-client";

export async function generateMetadata({ params }) {
    const contactId = params.contactId;
    const data = await getContactForms(contactId);

    return {
        title: data?.contact ? `${data.contact.name} | Patient Portal` : "Patient Portal | CareOps",
        description: "Secure access to your appointment details and required forms.",
    };
}

export default async function CustomerPortalPage({ params }) {
    const contactId = params.contactId;
    const data = await getContactForms(contactId);

    // Serialization for Client Component props (removes Date objects)
    const serializedData = JSON.parse(JSON.stringify(data));

    return <PortalClient contactId={contactId} initialData={serializedData} />;
}
