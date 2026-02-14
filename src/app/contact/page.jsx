import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Mail, MapPin, ArrowRight, ShieldCheck } from "lucide-react";

export default async function ContactDirectoryPage() {
    // Fetch all active workspaces that have channels and contact forms
    const workspaces = await prisma.workspace.findMany({
        where: {
            isActive: true,
            channels: { some: { isActive: true } }
        },
        include: {
            contactForms: true,
            serviceTypes: {
                where: { isActive: true },
                select: { name: true, id: true }
            }
        }
    });

    // Filter for workspaces that have actually published a form
    const activeWorkspaces = workspaces.filter(ws => ws.contactForms.length > 0);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
            <nav className="h-20 px-8 lg:px-16 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
                <Link href="/" className="font-bold text-xl tracking-tight flex items-center gap-2">
                    CareOps
                </Link>
            </nav>

            <main className="flex-1 max-w-7xl mx-auto w-full px-2 py-8 lg:py-8">
                <div className="space-y-16">
                    <header className="space-y-4 max-w-2xl">
                        <h1 className="text-5xl font-bold text-black tracking-tight leading-[1.1]">
                            Contact <span className="text-slate-400">Businesses</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            Select a business below to view their services and send a direct inquiry.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {activeWorkspaces.map((ws) => (
                            <Link
                                key={ws.id}
                                href={`/workspace/${ws.slug}/contact`}
                                className="group bg-white border border-slate-200 rounded-3xl p-8 hover:border-black transition-all duration-300 flex flex-col min-h-[380px]"
                            >
                                <div className="space-y-8 flex-1">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-bold text-black leading-tight">{ws.name}</h3>
                                            {ws.contactEmail && (
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Mail size={14} className="shrink-0" />
                                                    <span className="text-xs font-medium truncate">{ws.contactEmail}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-black transition-colors pt-2 shrink-0">
                                            Verified
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Services Offered</p>
                                        <div className="flex flex-wrap gap-2">
                                            {ws.serviceTypes.length > 0 ? (
                                                ws.serviceTypes.map(service => (
                                                    <span key={service.id} className="px-3 py-1.5 bg-white text-slate-600 rounded text-[11px] font-bold border border-slate-200 group-hover:bg-slate-100 group-hover:text-black transition-colors capitalize">
                                                        {service.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-300 italic">No public services listed</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 mt-8 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-black transition-colors">Open Inquiry Form</span>
                                    <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-300 group-hover:bg-black group-hover:border-black group-hover:text-white transition-all">
                                        <ArrowRight size={14} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {activeWorkspaces.length === 0 && (
                        <div className="text-center py-32 bg-white rounded-3xl border border-slate-100">
                            <ShieldCheck className="mx-auto text-slate-100 mb-6" size={64} />
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
                                No active registries found.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
