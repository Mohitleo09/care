import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Clock, MapPin, ArrowRight } from "lucide-react";
import { tempBootstrapPublicFlow } from "../dashboard/dashboard-actions";

// Helper to format days (e.g. "Mon-Fri" or "Mon, Wed, Fri")
function formatAvailability(availability) {
    if (!availability || availability.length === 0) return "No availability";

    // Map full names to indices for sorting
    const dayMap = {
        "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4,
        "Friday": 5, "Saturday": 6, "Sunday": 7
    };

    // Short names for display
    const shortMap = {
        "Monday": "Mon", "Tuesday": "Tue", "Wednesday": "Wed", "Thursday": "Thu",
        "Friday": "Fri", "Saturday": "Sat", "Sunday": "Sun"
    };

    // Get unique days, sort them
    const days = [...new Set(availability.map(a => a.dayOfWeek))]
        .sort((a, b) => dayMap[a] - dayMap[b]);

    if (days.length === 7) return "Every Day";

    // Check for consecutive range
    let isConsecutive = true;
    for (let i = 0; i < days.length - 1; i++) {
        if (dayMap[days[i + 1]] - dayMap[days[i]] !== 1) {
            isConsecutive = false;
            break;
        }
    }

    if (isConsecutive && days.length > 2) {
        return `${shortMap[days[0]]} - ${shortMap[days[days.length - 1]]}`;
    }

    return days.map(d => shortMap[d]).join(", ");
}

export default async function BookPage() {
    // 1. Fetch ALL active workspaces with their services AND availability
    let workspaces = await prisma.workspace.findMany({
        where: { isActive: true },
        include: {
            serviceTypes: {
                where: { isActive: true },
                include: { availability: true }
            }
        }
    });

    // 2. If no workspaces exist at all, trigger the bootstrap (fallback for fresh installs)
    if (workspaces.length === 0) {
        const bootstrap = await tempBootstrapPublicFlow();
        if (bootstrap.success) {
            workspaces = await prisma.workspace.findMany({
                where: { isActive: true },
                include: {
                    serviceTypes: {
                        where: { isActive: true },
                        include: { availability: true }
                    }
                }
            });
        }
    }

    // 3. Flatten services for the marketplace view
    const allServices = workspaces.flatMap(ws =>
        ws.serviceTypes.map(st => ({
            ...st,
            workspaceName: ws.name,
            workspaceSlug: ws.slug
        }))
    );

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
            <nav className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-slate-100 sticky top-0 bg-white z-50">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg tracking-tight">CareOps</span>
                </div>
            </nav>

            <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 lg:py-20">
                <div className="space-y-12">
                    <header className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Patient Directory</p>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Find care near you</h1>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allServices.map((s) => (
                            <Link
                                key={s.id}
                                href={`/workspace/${s.workspaceSlug}/book/${s.slug}`}
                                className="group p-8 border border-slate-100 rounded-3xl bg-white hover:border-slate-900 hover:shadow-2xl hover:shadow-slate-900/5 transition-all flex flex-col justify-between min-h-[220px]"
                            >
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.workspaceName}</p>
                                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-900 leading-tight">{s.name}</h3>
                                    </div>

                                    <div className="flex flex-col gap-2.5">
                                        <div className="flex items-center gap-2.5 text-slate-400">
                                            <Clock size={16} />
                                            <span className="text-sm font-semibold">{s.duration} minutes</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-sm font-semibold text-slate-500">{formatAvailability(s.availability)}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-slate-400">
                                            <MapPin size={16} />
                                            <span className="text-sm font-semibold">{s.location || 'In-person'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300 group-hover:text-slate-900 transition-colors">
                                    Book Appointment <ArrowRight size={14} />
                                </div>
                            </Link>
                        ))}
                    </div>

                    {allServices.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-slate-50 rounded-3xl">
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">No services available for booking.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
