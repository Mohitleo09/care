"use client";

import { useState, useTransition } from "react";
import { submitContactForm } from "../contact-actions";
import { User, Mail, Phone, MessageSquare, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContactFormClient({ workspaceId }) {
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        startTransition(async () => {
            const data = new FormData();
            Object.entries(formData).forEach(([k, v]) => data.append(k, v));
            data.append("workspaceId", workspaceId);

            const res = await submitContactForm(data);
            if (res.error) {
                setError(res.error);
            } else {
                setSuccess(true);
            }
        });
    };

    if (success) {
        return (
            <div className="border border-slate-100 rounded-xl p-8 text-center space-y-6">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                    <CheckCircle2 size={24} />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-900">Message sent</h2>
                    <p className="text-slate-500 text-sm">
                        Thank you for reaching out. We'll get back to you shortly.
                    </p>
                </div>
                <button
                    onClick={() => setSuccess(false)}
                    className="text-sm font-semibold text-slate-900 hover:text-slate-600 transition-colors"
                >
                    Send another message
                </button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-5">
                <FormField label="Full Name" icon={User}>
                    <input
                        required
                        className="care-input"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField label="Email Address" icon={Mail}>
                        <input
                            required
                            type="email"
                            className="care-input"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Phone Number" icon={Phone}>
                        <input
                            type="tel"
                            className="care-input"
                            placeholder="Enter your phone number"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </FormField>
                </div>

                <FormField label="Message" icon={MessageSquare}>
                    <textarea
                        className="care-input min-h-[100px] py-3 resize-none"
                        placeholder="Enter your message"
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                    />
                </FormField>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg flex items-center gap-3">
                    <AlertCircle size={16} className="shrink-0" /> {error}
                </div>
            )}

            <button
                disabled={isPending}
                className="w-full h-12 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isPending ? <Loader2 className="animate-spin" size={18} /> : <>Send Message <ArrowRight size={18} /></>}
            </button>

            <style jsx>{`
                .care-input {
                    width: 100%;
                    height: 48px;
                    padding: 0 16px;
                    border-radius: 8px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                    outline: none;
                }
                .care-input:focus {
                    border-color: #0f172a;
                    box-shadow: 0 0 0 1px #0f172a;
                }
            `}</style>
        </form>
    )
}

function FormField({ label, icon: Icon, children }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 px-1">
                <label className="text-sm font-semibold text-slate-700">{label}</label>
            </div>
            {children}
        </div>
    )
}
