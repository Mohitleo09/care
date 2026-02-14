import { prisma } from "@/lib/prisma";
import { Clock, MapPin, ArrowLeft, Calendar, User, Mail, Phone, MessageSquare } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAvailableSlots, submitBooking } from "@/app/booking-actions";

// Client Component for the form part
// We'll insert it directly here for now to ensure it works, 
// but in a real app this should be a separate file.
// Since we are in a server component file, we need a small wrapper or just make the whole page client?
// No, let's keep Server Component for data fetching and use a Client Component for the form.

import ServiceBookingForm from "./booking-form";

export default async function ServiceBookingPage({ params }) {
    const { slug, serviceSlug } = await params;

    // 1. Fetch Workspace & Service
    const workspace = await prisma.workspace.findFirst({
        where: { slug }
    });

    if (!workspace) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-slate-900">Practice Not Found</h1>
                    <p className="text-slate-500">We couldn't locate this clinic.</p>
                    <Link href="/book" className="text-blue-600 hover:underline">Back to Directory</Link>
                </div>
            </div>
        );
    }

    const service = await prisma.serviceType.findFirst({
        where: {
            slug: serviceSlug,
            workspaceId: workspace.id,
            isActive: true
        },
        include: {
            availability: true
        }
    });

    if (!service) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-slate-900">Service Not Available</h1>
                    <p className="text-slate-500">This service is no longer active.</p>
                    <Link href="/book" className="text-blue-600 hover:underline">Back to Directory</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <nav className="h-16 px-6 lg:px-12 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-50">
                <Link href="/book" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-bold uppercase tracking-widest">
                    <ArrowLeft size={16} /> Directory
                </Link>
                <span className="font-bold text-lg tracking-tight">{workspace.name}</span>
                <div className="w-20" /> {/* Spacer */}
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT: Service Details */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight mb-2">{service.name}</h1>
                                <p className="text-sm text-slate-500 leading-relaxed">{service.description || "No description provided."}</p>
                            </div>

                            <div className="space-y-4 border-t border-slate-100 pt-6">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Clock size={18} className="text-slate-400" />
                                    <span className="text-sm font-medium">{service.duration} minutes</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <MapPin size={18} className="text-slate-400" />
                                    <span className="text-sm font-medium">{service.location || "In-person at Clinic"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <User size={18} className="text-slate-400" />
                                    <span className="text-sm font-medium">1-on-1 Appointment</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Important</h3>
                            <ul className="space-y-3 text-sm text-slate-300">
                                <li className="flex gap-2">
                                    <span className="text-blue-400">•</span>
                                    <span>Please arrive 10 minutes early.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-blue-400">•</span>
                                    <span>Bring a valid ID.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* RIGHT: Booking Form (Client Component) */}
                    <div className="lg:col-span-2">
                        <ServiceBookingForm
                            service={{
                                ...service,
                                price: service.price ? service.price.toString() : "0"
                            }}
                            workspace={workspace}
                            getAvailableSlots={getAvailableSlots}
                            submitBooking={submitBooking}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
