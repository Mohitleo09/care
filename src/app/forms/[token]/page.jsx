import { prisma } from "@/lib/prisma";
import { ShieldCheck, Calendar, User, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import FormSubmissionClient from "./form-submission-client";

export async function generateMetadata({ params }) {
    const { token } = await params;
    const instance = await prisma.formInstance.findUnique({
        where: { accessToken: token },
        include: { formTemplate: true }
    });

    return {
        title: `${instance?.formTemplate.name || "Protocol"} | CareOps`,
    };
}

export default async function FormPage({ params }) {
    const { token } = await params;

    const instance = await prisma.formInstance.findUnique({
        where: { accessToken: token },
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

    if (!instance) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50 p-8 text-center">
                <div className="max-w-sm space-y-4">
                    <AlertCircle className="mx-auto text-rose-500" size={48} />
                    <h1 className="text-xl font-bold text-slate-900">Protocol Link Invalid</h1>
                    <p className="text-slate-500 text-sm font-medium">This secure transmission link has either expired or does not exist in our operational records.</p>
                </div>
            </div>
        );
    }

    if (instance.status === "COMPLETED") {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50 p-8 text-center">
                <div className="max-w-sm space-y-6">
                    <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-slate-900/10">
                        <CheckCircle2 size={32} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Protocol Fulfilled</h1>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">
                            Thank you, {instance.booking.contact.name}. This documentation has been securely anchored to your profile.
                        </p>
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-xl text-left space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Service</span>
                            <span className="text-slate-900">{instance.booking.serviceType.name}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Date</span>
                            <span className="text-slate-900">{instance.booking.dateTime.toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 pb-20">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <main className="space-y-8">
                    {/* Header Section */}
                    <div className="text-center space-y-2 mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 mb-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            {instance.booking.contact.email}
                        </div>
                        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">{instance.formTemplate.name}</h1>
                        <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
                            {instance.formTemplate.description || "Please take a moment to fill out the details below."}
                        </p>
                    </div>

                    {/* Form Fields - Serialize to ensure no Decimal objects pass to client */}
                    <FormSubmissionClient
                        instanceId={instance.id}
                        fields={serializeData(instance.formTemplate.fields || [])}
                        token={token}
                    />
                </main>

                <footer className="mt-20 border-t border-slate-100 pt-8 text-center">
                    <p className="text-slate-400 text-sm">Sent to <span className="text-slate-900 font-medium">{instance.booking.contact.name}</span> • <span className="text-slate-400">{instance.booking.dateTime.toLocaleDateString()}</span></p>
                </footer>
            </div>
        </div>
    );
}

function ContextItem({ icon: Icon, label, value }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Icon size={12} /> {label}
            </p>
            <p className="text-sm font-bold text-slate-900">{value}</p>
        </div>
    )
}

function serializeData(data) {
    try {
        return JSON.parse(JSON.stringify(data, (key, value) => {
            // value is the value *after* toJSON is called if it exists. 
            // Prisma Decimal might not have toJSON, or it might return string.
            // If it comes invalid, we catch it here.

            // Check if it's a Decimal-like object (has known Decimal traits or behaves like one)
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                if (value.constructor?.name === 'Decimal' || typeof value.toFixed === 'function' || ('d' in value && 'e' in value && 's' in value)) {
                    return value.toString();
                }
            }
            return value;
        }));
    } catch (e) {
        console.error("Serialization failed:", e);
        return [];
    }
}
