import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ContactFormClient from "@/app/contact/contact-form-client";
import { Layout, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";

export default async function WorkspaceContactPage({ params }) {
    const { slug } = await params;

    const workspace = await prisma.workspace.findUnique({
        where: { slug },
        include: {
            channels: { where: { isActive: true } },
            contactForms: true
        }
    });

    if (!workspace || !workspace.isActive) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 max-w-md space-y-6">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl mx-auto flex items-center justify-center">
                        <ShieldCheck size={32} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900">Inquiry Gateway Offline</h1>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            This workspace is currently not accepting new inquiries. Please contact the administrator or try again later.
                        </p>
                    </div>
                    <Link href="/" className="inline-block px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold active:scale-95 transition-all">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    // Step 1 check: Contact form is published
    if (workspace.contactForms.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 max-w-md space-y-6">
                    <h1 className="text-xl font-bold text-slate-900">Form Not Available</h1>
                    <p className="text-sm text-slate-500">The contact form for this workspace has not been published yet.</p>
                </div>
            </div>
        );
    }

    // Step 1 check: At least one communication channel connected
    const hasActiveChannel = workspace.channels.length > 0;
    if (!hasActiveChannel) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 max-w-md space-y-6">
                    <h1 className="text-xl font-bold text-slate-900">Communication Offline</h1>
                    <p className="text-sm text-slate-500">This workspace has no active communication channels. Please check back later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFF] font-sans text-slate-900 flex flex-col">
            <nav className="h-20 px-8 lg:px-16 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform">
                        <ShieldCheck size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">{workspace.name}</span>
                </Link>
            </nav>

            <main className="flex-1 max-w-6xl mx-auto w-full px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-10">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Open for Inquiries</span>
                        </div>
                        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                            How can we <span className="text-slate-400">help you?</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-md">
                            Fill out the form and our team will get back to you through your preferred contact method.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {workspace.contactEmail && (
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Email Us</p>
                                    <p className="text-sm font-bold text-slate-900">{workspace.contactEmail}</p>
                                </div>
                            </div>
                        )}
                        {workspace.address && (
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Visit Us</p>
                                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{workspace.address}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-[2rem] p-8 lg:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]">
                    <ContactFormClient workspaceId={workspace.id} />
                </div>
            </main>

            <footer className="py-12 px-8 border-t border-slate-50 text-center">
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">&copy; {new Date().getFullYear()} {workspace.name} • Powered by CareOps</p>
            </footer>
        </div>
    );
}
