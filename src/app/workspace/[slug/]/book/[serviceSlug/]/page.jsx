import { prisma } from "@/lib/prisma";
import Link from "next/link";
import BookingClientV2 from "./booking-client-v2";
import { Layout, ChevronLeft } from "lucide-react";

export default async function ServiceBookingPage({ params }) {
    const { slug, serviceSlug } = params;

    const workspace = await prisma.workspace.findFirst({
        where: { slug }
    });

    if (!workspace) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="space-y-4 max-w-sm">
                    <h1 className="text-xl font-bold text-slate-900">Workspace Unavailable</h1>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        The requested workspace either doesn't exist or is currently offline.
                    </p>
                    <Link href="/" className="inline-block text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    const service = await prisma.serviceType.findFirst({
        where: { slug: serviceSlug, workspaceId: workspace.id, isActive: true }
    });

    if (!service) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="space-y-4 max-w-sm">
                    <h1 className="text-xl font-bold text-slate-900">Service Not Found</h1>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        This specific service is no longer available for booking.
                    </p>
                    <Link href={`/workspace/${slug}/book`} className="inline-block text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                        Back to services
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
            <nav className="h-20 px-8 lg:px-14 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-xl z-50">
                <div className="flex items-center gap-6">
                    <Link href={`/workspace/${slug}/book`} className="text-slate-400 hover:text-slate-900 transition-colors">
                        <ChevronLeft size={24} />
                    </Link>
                    <span className="font-bold text-sm tracking-tight">{workspace.name}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Live Scheduling</span>
                </div>
            </nav>

            <main className="flex-1 max-w-6xl mx-auto w-full px-8 py-12 lg:py-20">
                <BookingClientV2 workspace={workspace} service={service} />
            </main>
        </div>
    );
}
