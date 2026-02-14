"use client";

import { useState, useEffect } from "react";
import {
    CheckCircle2,
    FileText,
    Clock,
    ArrowRight,
    ShieldCheck,
    Layout,
    Loader2,
    Calendar,
    MapPin,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getContactForms, submitPortalForm } from "../portal-actions";

export default function PortalClient({ contactId, initialData }) {
    const [state, setState] = useState(initialData);
    const [activeForm, setActiveForm] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [signature, setSignature] = useState("");

    // Reset signature when form changes
    useEffect(() => {
        if (activeForm) setSignature("");
    }, [activeForm]);

    async function loadData() {
        const data = await getContactForms(contactId);
        setState(data);
    }

    async function handleSubmit(formId, formData) {
        setIsSubmitting(true);
        const data = new FormData();
        data.append("contactId", contactId);
        data.append("formId", formId);
        data.append("data", JSON.stringify(formData));

        const res = await submitPortalForm(data);
        if (res.success) {
            setActiveForm(null);
            await loadData();
        }
        setIsSubmitting(false);
    }

    if (!state) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10 text-center">
            <div className="max-w-sm space-y-4">
                <AlertCircle size={48} className="text-rose-500 mx-auto" />
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Unavailable</h1>
                <p className="text-sm text-slate-500 font-medium">This access link is either invalid or expired. Please contact us for a new link.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
            <nav className="h-20 bg-white border-b border-slate-100 px-8 lg:px-14 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold tracking-tight text-slate-900">CareOps Portal</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                    <ShieldCheck size={14} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Secure Access</span>
                </div>
            </nav>

            <main className="flex-1 p-8 lg:p-20 max-w-5xl mx-auto w-full space-y-16 animate-luxury-in">

                <div className="space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Welcome,</p>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{state.contact.name}</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

                    {/* UPCOMING APPOINTMENT */}
                    <div className="md:col-span-12 lg:col-span-5">
                        <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-8 shadow-xl">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Next Appointment</p>
                                <h3 className="text-2xl font-bold tracking-tight">{state.booking?.serviceType.name || "No Scheduled Appointments"}</h3>
                            </div>
                            {state.booking && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 shrink-0">
                                            <Calendar size={16} />
                                        </div>
                                        <p className="text-sm font-bold">{new Date(state.booking.dateTime).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 shrink-0">
                                            <MapPin size={16} />
                                        </div>
                                        <p className="text-sm font-bold">{state.booking.serviceType.location || "In-person"}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FORMS SECTION */}
                    <div className="md:col-span-12 lg:col-span-7 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Required Forms</h4>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
                                {state.forms.filter(f => f.isCompleted).length} / {state.forms.length} Done
                            </span>
                        </div>

                        <div className="space-y-3">
                            {state.forms.map((form) => (
                                <div key={form.id} className={cn(
                                    "p-6 rounded-2xl border transition-all flex items-center justify-between group",
                                    form.isCompleted ? "bg-slate-50 border-slate-100" : "bg-white border-slate-200 hover:border-slate-900"
                                )}>
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center border shrink-0",
                                            form.isCompleted ? "bg-white border-slate-100 text-slate-300" : "bg-white border-slate-200 text-slate-400"
                                        )}>
                                            {form.isCompleted ? <CheckCircle2 size={20} /> : <FileText size={20} />}
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-900 text-base tracking-tight">{form.name}</h5>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                {form.isCompleted ? "Submitted" : "Action Required"}
                                            </p>
                                        </div>
                                    </div>
                                    {!form.isCompleted && (
                                        <button
                                            onClick={() => setActiveForm(form)}
                                            className="h-10 px-6 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all"
                                        >
                                            Complete Form
                                        </button>
                                    )}
                                </div>
                            ))}

                            {state.forms.length === 0 && (
                                <div className="text-center py-16 bg-white border-2 border-dashed border-slate-100 rounded-3xl">
                                    <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">No forms required at this time.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>

            {/* FORM FILLING OVERLAY */}
            {activeForm && (
                <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95">
                        <header className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Required Documentation</p>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{activeForm.name}</h3>
                            </div>
                            <button onClick={() => setActiveForm(null)} className="text-slate-300 hover:text-slate-900 text-[10px] font-bold uppercase tracking-widest">Cancel</button>
                        </header>
                        <div className="p-8 space-y-8">
                            <div className="space-y-6">
                                <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                                    "By typing your name below, you confirm that the information provided is accurate and you agree to our service terms."
                                </p>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                                    <input
                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-slate-900 outline-none transition-all font-medium text-sm"
                                        placeholder="Type your name..."
                                        autoFocus
                                        value={signature}
                                        onChange={(e) => setSignature(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                disabled={isSubmitting || !signature}
                                onClick={() => handleSubmit(activeForm.id, { signed: true, signature })}
                                className="w-full h-14 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (
                                    <>Confirm & Submit <ArrowRight size={16} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="py-12 border-t border-slate-100 bg-white">
                <div className="max-w-5xl mx-auto px-8 flex justify-between items-center text-slate-300">
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                        <ShieldCheck size={14} /> Encrypted Session
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest">
                        © 2026 CareOps
                    </div>
                </div>
            </footer>
        </div>
    );
}
