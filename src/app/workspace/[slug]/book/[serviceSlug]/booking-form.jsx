"use client";

import { useState, useTransition, useEffect } from "react";
import { getAvailableSlots, submitBooking } from "@/app/booking-actions";
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

export default function BookingForm({ workspace, service }) {
    const [step, setStep] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const [selectedDate, setSelectedDate] = useState("");
    const [availableSlots, setAvailableSlots] = useState([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    const [contact, setContact] = useState({ name: "", email: "", phone: "" });
    const [selectedTime, setSelectedTime] = useState(null);

    // Handle date selection to fetch slots
    useEffect(() => {
        if (selectedDate && step === 1) {
            fetchSlots(selectedDate);
        }
    }, [selectedDate, step]);

    async function fetchSlots(date) {
        setIsLoadingSlots(true);
        try {
            const slots = await getAvailableSlots(service.id, date);
            setAvailableSlots(slots);
        } catch (err) {
            console.error("Failed to fetch slots:", err);
            setAvailableSlots([]);
        } finally {
            setIsLoadingSlots(false);
        }
    }

    const handleSubmit = async () => {
        setError("");
        startTransition(async () => {
            try {
                const data = new FormData();
                data.append("name", contact.name);
                data.append("email", contact.email);
                data.append("phone", contact.phone);
                data.append("serviceTypeId", service.id);
                data.append("dateTime", selectedTime.toISOString());
                data.append("workspaceId", workspace.id);

                const res = await submitBooking(data);
                if (res.error) {
                    setError(res.error);
                } else {
                    setSuccess(true);
                }
            } catch (err) {
                setError("An unexpected error occurred. Please try again.");
            }
        });
    };

    if (success) {
        return (
            <div className="bg-white border border-slate-100 rounded-[40px] p-12 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/10">
                    <CheckCircle2 size={40} strokeWidth={2.5} />
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Booking confirmed</h2>
                    <p className="text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                        Your appointment has been reserved. Check your email for confirmation and required forms.
                    </p>
                </div>
                <div className="pt-4">
                    <button
                        onClick={() => window.location.href = `/workspace/${workspace.slug}/book`}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        Return to Services
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* LEFT: SUMMARY */}
            <div className="md:col-span-4 space-y-6">
                <div className="bg-slate-900 rounded-[32px] p-8 text-white space-y-8 sticky top-24">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service</p>
                        <h3 className="text-2xl font-bold tracking-tight">{service.name}</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Clock size={16} className="text-slate-400" />
                            <span className="text-sm font-bold">{service.duration} mins</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin size={16} className="text-slate-400" />
                            <span className="text-sm font-bold">{service.location || 'In-person'}</span>
                        </div>
                    </div>

                    {selectedTime && (
                        <div className="pt-6 border-t border-white/10 space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scheduled For</p>
                            <p className="text-sm font-bold">{new Date(selectedTime).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                            <p className="text-lg font-black">{new Date(selectedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: STEPS */}
            <div className="md:col-span-8 space-y-8">
                {/* STEP 1: TIME SELECTION */}
                {step === 1 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-6">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Date</h4>
                            <input
                                type="date"
                                className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-bold focus:bg-white focus:border-slate-900 outline-none transition-all"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        {selectedDate && (
                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Available Times</h4>
                                {isLoadingSlots ? (
                                    <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-slate-200" size={32} /></div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {availableSlots.map((slot, i) => {
                                            const slotDate = new Date(slot);
                                            const isSelected = selectedTime && slotDate.getTime() === selectedTime.getTime();
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => setSelectedTime(slotDate)}
                                                    className={cn(
                                                        "h-14 rounded-xl border text-sm font-black transition-all",
                                                        isSelected
                                                            ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20"
                                                            : "bg-white border-slate-100 text-slate-900 hover:border-slate-900"
                                                    )}
                                                >
                                                    {slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {!isLoadingSlots && availableSlots.length === 0 && (
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest text-center py-12">No availability for this date.</p>
                                )}
                            </div>
                        )}

                        <div className="pt-8">
                            <button
                                disabled={!selectedTime}
                                onClick={() => setStep(2)}
                                className="w-full h-16 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/10 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:hover:translate-y-0"
                            >
                                Continue to Details <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: PERSONAL INFO */}
                {step === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <header className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Personal Details</h4>
                            <button onClick={() => setStep(1)} className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Change Time</button>
                        </header>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-base font-bold focus:bg-white focus:border-slate-900 outline-none transition-all"
                                        placeholder="John Doe"
                                        value={contact.name}
                                        onChange={e => setContact({ ...contact, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-base font-bold focus:bg-white focus:border-slate-900 outline-none transition-all"
                                            placeholder="john@example.com"
                                            value={contact.email}
                                            onChange={e => setContact({ ...contact, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-base font-bold focus:bg-white focus:border-slate-900 outline-none transition-all"
                                            placeholder="+1 (555) 000-0000"
                                            value={contact.phone}
                                            onChange={e => setContact({ ...contact, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black rounded-2xl flex items-center gap-3">
                                <AlertCircle size={14} className="shrink-0" /> {error}
                            </div>
                        )}

                        <div className="pt-8">
                            <button
                                disabled={isPending || !contact.name || (!contact.email && !contact.phone)}
                                onClick={handleSubmit}
                                className="w-full h-16 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/10 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:hover:translate-y-0"
                            >
                                {isPending ? <Loader2 className="animate-spin" size={20} /> : (
                                    <>Confirm Appointment <ArrowRight size={18} /></>
                                )}
                            </button>
                            <p className="mt-6 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                Secure Transaction Protected by CareOps Shield
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
