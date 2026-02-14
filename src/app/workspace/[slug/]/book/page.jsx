import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Layout, Calendar, Clock, MapPin, ArrowRight } from "lucide-react";

export default async function WorkspaceBookPage({ params }) {
    const { slug } = params;

    const workspace = await prisma.workspace.findFirst({
        where: { slug },
        include: { serviceTypes: { where: { isActive: true } } }
    });

    if (!workspace) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="space-y-4 max-w-sm">
                    <h1 className="text-xl font-bold text-slate-900">Workspace Not Found</h1>
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

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
            <nav className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-slate-100 sticky top-0 bg-white z-50">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg tracking-tight">{workspace.name}</span>
                </div>
            </nav>

            <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 lg:py-20">
                <div className="space-y-12">
                    <header className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Patient Portal</p>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Select a service</h1>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {workspace.serviceTypes.map((s) => (
                            <Link
                                key={s.id}
                                href={`/workspace/${slug}/book/${s.slug}`}
                                className="group p-8 border border-slate-100 rounded-3xl bg-white hover:border-slate-900 hover:shadow-2xl hover:shadow-slate-900/5 transition-all flex flex-col justify-between min-h-[200px]"
                            >
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-900">{s.name}</h3>
                                    <div className="flex flex-col gap-2.5">
                                        <div className="flex items-center gap-2.5 text-slate-400">
                                            <Clock size={16} />
                                            <span className="text-sm font-semibold">{s.duration} minutes</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-slate-400">
                                            <MapPin size={16} />
                                            <span className="text-sm font-semibold">{s.location || 'In-person'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300 group-hover:text-slate-900 transition-colors">
                                    Continue to Booking <ArrowRight size={14} />
                                </div>
                            </Link>
                        ))}
                    </div>

                    {workspace.serviceTypes.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-slate-50 rounded-3xl">
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">No services available for booking.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
