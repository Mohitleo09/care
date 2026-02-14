"use client";

import { useState, useTransition } from "react";
import { submitBooking } from "../booking-actions";
import {
    Clock,
    MapPin,
    Calendar as CalendarIcon,
    User,
    Mail,
    Phone,
    ArrowRight,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BookingClient({ workspace, serviceTypes }) {
    const [step, setStep] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [contact, setContact] = useState({ name: "", email: "", phone: "" });

    const handleSubmit = async () => {
        setError("");
        startTransition(async () => {
            const data = new FormData();
            data.append("name", contact.name);
            data.append("email", contact.email);
            data.append("phone", contact.phone);
            data.append("serviceTypeId", selectedService.id);
            data.append("dateTime", selectedDate);
            data.append("workspaceId", workspace.id);

            const res = await submitBooking(data);
            if (res.error) {
                setError(res.error);
            } else {
                setSuccess(true);
            }
        });
    };

    if (success) {
        return (
            <div className="border border-slate-100 rounded-xl p-8 text-center space-y-6 max-w-sm mx-auto">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                    <CheckCircle2 size={24} />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-900">Booking confirmed</h2>
                    <p className="text-slate-500 text-sm">
                        Your appointment has been reserved. You'll receive a confirmation shortly.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-12 gap-6 items-start">

            {/* PROGRESS TRACKER */}
            <div className="col-span-12 lg:col-span-3 space-y-3">
                <BookingStep id={1} label="Service" active={step === 1} done={step > 1} />
                <BookingStep id={2} label="Time" active={step === 2} done={step > 2} />
                <BookingStep id={3} label="Details" active={step === 3} done={step > 3} />
            </div>

            {/* ACTION AREA */}
            <div className="col-span-12 lg:col-span-9 border border-slate-100 rounded-xl p-6 lg:p-8 min-h-[400px] flex flex-col relative">
                <div className="flex-1">

                    {/* STEP 1: SERVICE */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Select a Service</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {serviceTypes.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelectedService(s)}
                                        className={cn(
                                            "p-6 border rounded-xl text-left transition-all",
                                            selectedService?.id === s.id ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-100 hover:border-slate-300"
                                        )}
                                    >
                                        <h4 className="text-base font-bold mb-3">{s.name}</h4>
                                        <div className="flex flex-col gap-2 opacity-70 text-xs font-medium">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} /> {s.duration} mins
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} /> {s.location || 'In-person'}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: DATE */}
                    {step === 2 && (
                        <div className="space-y-6 py-6">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-center">Pick a Date and Time</h3>
                            <div className="max-w-xs mx-auto">
                                <input
                                    type="datetime-local"
                                    className="w-full h-12 px-4 border border-slate-200 rounded-lg text-lg font-semibold focus:outline-none focus:border-slate-900"
                                    value={selectedDate}
                                    onChange={e => setSelectedDate(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: IDENTITY */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Your Details</h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                                    <input className="public-input h-12 px-4 w-full" placeholder="John Doe" value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                                        <input className="public-input h-12 px-4 w-full" placeholder="john@example.com" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Phone</label>
                                        <input className="public-input h-12 px-4 w-full" placeholder="+91 98XXX XXXX" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-8 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-black rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={14} className="shrink-0" /> {error}
                        </div>
                    )}
                </div>

                <div className="h-16 flex items-center justify-between border-t border-slate-100 mt-6 pt-4">
                    <button
                        onClick={() => setStep(step - 1)}
                        className={cn(
                            "flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-all",
                            step === 1 && "opacity-0 pointer-events-none"
                        )}
                    >
                        <ChevronLeft size={16} /> Back
                    </button>

                    <button
                        disabled={isPending || (step === 1 && !selectedService) || (step === 2 && !selectedDate)}
                        onClick={step === 3 ? handleSubmit : () => setStep(step + 1)}
                        className="h-12 px-8 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="animate-spin" size={18} /> :
                            step === 3 ? "Book Appointment" : "Continue"}
                    </button>
                </div>
            </div>
        </div>
    )
}

function BookingStep({ id, label, active, done }) {
    return (
        <div className={cn(
            "p-4 rounded-xl border transition-all flex items-center gap-3",
            active ? "bg-white border-slate-200" :
                done ? "bg-emerald-50 border-emerald-100" :
                    "bg-slate-50 border-transparent opacity-50"
        )}>
            <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                active ? "bg-slate-900 text-white" :
                    done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
            )}>
                {done ? <CheckCircle2 size={12} strokeWidth={3} /> : id}
            </div>
            <span className={cn(
                "text-xs font-bold",
                active ? "text-slate-900" : "text-slate-400"
            )}>{label}</span>
        </div>
    )
}
