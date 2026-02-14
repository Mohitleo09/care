import { prisma } from "@/lib/prisma";
import ContactFormClient from "../../contact/contact-form-client";
import { Layout, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PublicGatewayPage({ params }) {
    const { slug } = params;

    const form = await prisma.contactForm.findUnique({
        where: { slug },
        include: { workspace: true }
    });

    if (!form) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
            {/* CLEAN NAVIGATION */}
            <nav className="h-20 px-8 lg:px-14 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-50">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg shadow-slate-900/10">
                        <Layout className="text-white" size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900 uppercase tracking-widest leading-none">
                        {form.workspace.name}
                    </span>
                </div>
            </nav>

            <main className="flex-1 overflow-hidden flex items-center justify-center p-8 lg:p-12 bg-slate-50/50">
                <div className="max-w-[1000px] w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

                    {/* LEFT COLUMN: BRAND MESSAGE */}
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                                {form.name}
                            </h1>
                            <p className="text-slate-500 text-lg font-medium leading-relaxed">
                                Please provide your details below. Our team at {form.workspace.name} will review your inquiry and reach out via your preferred contact method.
                            </p>
                        </div>

                        <div className="pt-8 border-t border-slate-200 flex flex-col gap-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Operational Secure Gateway</p>
                            <div className="flex items-center gap-2 text-slate-900">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-widest">Always Online</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: REFINED FORM CARD */}
                    <div className="bg-white border border-slate-100 rounded-[40px] p-10 lg:p-14 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                        <div className="relative z-10 space-y-8">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-slate-900">Contact Form</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Entry Point: {form.slug}</p>
                            </div>
                            <ContactFormClient workspaceId={form.workspaceId} />
                        </div>
                    </div>

                </div>
            </main>

            <footer className="h-20 flex items-center justify-center border-t border-slate-100 bg-white">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">
                    Powered by CareOps Operating System
                </p>
            </footer>
        </div>
    );
}
