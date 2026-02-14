"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Phone, Mail, User, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Calendar as CalendarIcon, Clock } from "lucide-react";

export default function ServiceBookingForm({ service, workspace, getAvailableSlots, submitBooking }) {
    const [step, setStep] = useState(1); // 1: Date/Time, 2: Details, 3: Success
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: ""
    });
    const [bookingResult, setBookingResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Fetch slots when date changes
    useEffect(() => {
        async function fetchSlots() {
            if (!selectedDate) return;
            setLoadingSlots(true);
            setSlots([]);
            setSelectedSlot(null);

            try {
                const available = await getAvailableSlots(service.id, selectedDate);
                setSlots(available);
            } catch (err) {
                console.error("Failed to load slots", err);
            } finally {
                setLoadingSlots(false);
            }
        }
        fetchSlots();
    }, [selectedDate, service.id]);

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const payload = new FormData();
            payload.append("name", formData.name);
            payload.append("email", formData.email);
            payload.append("phone", formData.phone);
            payload.append("serviceTypeId", service.id);
            payload.append("workspaceId", workspace.id);
            payload.append("dateTime", selectedSlot.toISOString());

            const result = await submitBooking(payload);

            if (result.success) {
                setBookingResult(result);
                setStep(3);
            } else {
                setError(result.error || "Booking failed. Please try again.");
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setSubmitting(false);
        }
    }

    if (step === 3 && bookingResult) {
        return (
            <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-xl shadow-emerald-50 text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="text-emerald-500" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Booking Confirmed!</h2>
                <div className="space-y-2 text-slate-500 text-sm">
                    <p>We have sent a confirmation to <strong>{formData.email}</strong>.</p>
                    <p>Your appointment for <span className="font-bold text-slate-900">{service.name}</span> is scheduled for:</p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4 font-mono text-xs text-slate-700 font-bold">
                        {new Date(selectedSlot).toLocaleString()}
                    </div>
                </div>
                <button
                    onClick={() => window.location.href = '/'}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-lg"
                >
                    Return to Home
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header Steps */}
            <div className="flex border-b border-slate-100">
                <div className={`flex-1 p-4 text-center border-b-2 ${step === 1 ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest">1. Time</span>
                </div>
                <div className={`flex-1 p-4 text-center border-b-2 ${step === 2 ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest">2. Details</span>
                </div>
            </div>

            <div className="p-6 lg:p-8">
                {step === 1 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <CalendarIcon size={16} /> Select Date
                            </label>
                            <input
                                type="date"
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                            />
                        </div>

                        {selectedDate && (
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Clock size={16} /> Available Slots
                                </label>

                                {loadingSlots ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="animate-spin text-slate-300" />
                                    </div>
                                ) : slots.length > 0 ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                        {slots.map((slot, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`p-3 rounded-lg text-sm font-bold transition-all border ${selectedSlot === slot
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-md transform scale-105"
                                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 text-sm font-medium text-center">
                                        No slots available for this date.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <button
                                disabled={!selectedSlot}
                                onClick={() => setStep(2)}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                Continue <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                            <Clock className="text-blue-500 shrink-0 mt-0.5" size={16} />
                            <div>
                                <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">Selected Time</p>
                                <p className="text-sm font-bold text-blue-900 mt-1">
                                    {new Date(selectedSlot).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Jane Doe"
                                        className="w-full pl-10 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-slate-900 outline-none transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            required
                                            type="email"
                                            placeholder="jane@example.com"
                                            className="w-full pl-10 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-slate-900 outline-none transition-all"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            type="tel"
                                            placeholder="(555) 123-4567"
                                            className="w-full pl-10 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-slate-900 outline-none transition-all"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium flex items-center gap-2">
                                <AlertTriangle size={16} /> {error}
                            </div>
                        )}

                        <div className="pt-4 flex justify-between">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-6 py-3 text-slate-500 font-bold uppercase tracking-widest text-xs hover:text-slate-900 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                            >
                                {submitting ? (
                                    <>Processing <Loader2 className="animate-spin" size={14} /></>
                                ) : (
                                    <>Confirm Booking <ArrowRight size={14} /></>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
