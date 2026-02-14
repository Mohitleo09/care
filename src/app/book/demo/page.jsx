"use client";

import { useState } from "react";
import {
    Calendar,
    Clock,
    MapPin,
    User,
    CheckCircle2,
    ArrowRight,
    Layout,
    Globe,
    Lock,
    ChevronLeft,
    Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

import { submitBooking } from "../../booking-actions";


const TIME_SLOTS = ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"];

export default function BookingPage() {
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);

    // Form State
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Validation helpers
    const isStep1Valid = selectedDate && selectedTime;
    const isStep2Valid = name.trim().length >= 2 && email.includes("@");

    const handleFinalize = async () => {
        if (!isStep2Valid) {
            setError("Please provide valid name and email");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await submitBooking({
                name: name.trim(),
                email: email.trim(),
                date: selectedDate,
                time: selectedTime
            });

            if (res.error) {
                setError(res.error);
            } else {
                setSuccess(true);
                setStep(3);
            }
        } catch (err) {
            console.error(err);
            setError("Unable to connect to server. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (step === 1 && !isStep1Valid) {
            setError("Please select both date and time");
            return;
        }
        setError(null);
        setStep(step + 1);
    };

    const handleBack = () => {
        setError(null);
        setStep(step - 1);
    };

    return (
        <div className="h-screen bg-white font-sans text-slate-900 flex items-center justify-center relative overflow-hidden app-viewport">
            {/* 
         LUXURY BACKGROUND 
      */}
            <div className="absolute inset-0 bg-slate-50/50 pointer-events-none" />
            <div className="absolute top-0 right-0 p-20 opacity-[0.03]">
                <Layout size={600} strokeWidth={0.5} />
            </div>

            <div className="w-full max-w-6xl h-[85vh] bg-white rounded-3xl border border-slate-100 shadow-2xl relative z-10 grid md:grid-cols-12 overflow-hidden animate-luxury-in">

                {/* LEFT BRAND PANEL */}
                <div className="md:col-span-4 bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-sm shadow-xl">
                            <Layout size={20} className="text-white" strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white uppercase tracking-widest leading-none">CareOps</span>
                    </div>

                    <div className="relative z-10 space-y-12">
                        <div>
                            <div className="flex items-center gap-2 mb-6 opacity-60">
                                <Briefcase size={12} strokeWidth={2.5} />
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Institutional Service</span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.05] mb-6">Strategic Node Consultation</h1>
                            <p className="text-slate-400 font-medium leading-relaxed text-[15px]">
                                A high-level discovery session designed to map your operational requirements and provision your dedicated enterprise environment.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-5 p-5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                                <Clock className="text-slate-400" size={24} strokeWidth={2} />
                                <div>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Standard Duration</p>
                                    <p className="font-semibold text-sm text-white">45 Minutes</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-5 p-5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                                <Globe className="text-slate-400" size={24} strokeWidth={2} />
                                <div>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Session Locale</p>
                                    <p className="font-semibold text-sm text-white">Secure Digital Stream</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-3 pt-10 border-t border-white/10">
                        <Lock size={14} className="text-emerald-500" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">End-to-End Encrypted Transfer</p>
                    </div>
                </div>

                {/* RIGHT INTERACTION PANEL */}
                <div className="md:col-span-8 bg-white flex flex-col relative">
                    {/* Progress Line */}
                    <div className="h-1 bg-slate-50 w-full shrink-0">
                        <div className="h-full bg-slate-900 transition-all duration-700 ease-in-out" style={{ width: `${(step / 3) * 100}%` }} />
                    </div>

                    <div className="flex-1 overflow-y-auto p-12 lg:p-16 scroll-smooth">
                        {step === 1 && (
                            <div className="flex flex-col h-full space-y-12 animate-luxury-in">
                                <header>
                                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Availability</h2>
                                    <p className="text-slate-500 font-medium text-[15px]">Select a secure window for your consultation node.</p>
                                </header>

                                <div className="grid lg:grid-cols-2 gap-16 flex-1">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.2em]">December 2026</span>
                                            <div className="flex gap-2">
                                                <span className="w-2 h-2 rounded-full bg-slate-200" />
                                                <span className="w-2 h-2 rounded-full bg-slate-900" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-7 gap-x-2 gap-y-4 text-center">
                                            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                                                <span key={i} className="text-[10px] font-bold text-slate-300 uppercase">{d}</span>
                                            ))}
                                            {[...Array(31)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setSelectedDate(i + 1)}
                                                    className={cn(
                                                        "w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold transition-all mx-auto relative",
                                                        i + 1 === 12
                                                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/40 z-10 scale-110"
                                                            : i + 1 < 10
                                                                ? "text-slate-200 pointer-events-none"
                                                                : "hover:bg-slate-50 hover:text-slate-900 text-slate-600"
                                                    )}
                                                >
                                                    {i + 1}
                                                    {i + 1 === 12 && <span className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.2em]">Operational Windows</span>
                                        </div>
                                        <div className="space-y-3">
                                            {TIME_SLOTS.map((time) => (
                                                <button
                                                    key={time}
                                                    onClick={() => setSelectedTime(time)}
                                                    className={cn(
                                                        "w-full p-4 rounded-xl border transition-all flex justify-between items-center group shadow-sm",
                                                        selectedTime === time
                                                            ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                                                            : "bg-white border-slate-100/80 hover:border-slate-300 text-slate-600"
                                                    )}
                                                >
                                                    <span className="font-bold text-[14px] tracking-tight">{time}</span>
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                        selectedTime === time ? "bg-white border-white text-slate-900" : "border-slate-200 text-transparent"
                                                    )}>
                                                        <CheckCircle2 size={12} strokeWidth={4} />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="h-full flex flex-col items-center justify-center text-center animate-luxury-in max-w-md mx-auto">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-10 shadow-inner">
                                    <User size={40} className="text-slate-300" strokeWidth={1.5} />
                                </div>
                                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Associate Identity</h2>
                                <p className="text-slate-400 font-medium mb-12 uppercase text-[10px] font-bold tracking-[0.3em] pt-2">
                                    Credentials required for Secure Document Dispatch
                                </p>

                                <div className="w-full space-y-6">
                                    <div className="relative group text-left">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Full Legal Name</label>
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            type="text"
                                            className="luxury-input h-14 pl-5 text-lg font-semibold bg-white w-full border border-slate-200 rounded-xl"
                                            placeholder="e.g. Alex Smith"
                                            aria-label="Full name"
                                            required
                                        />
                                    </div>
                                    <div className="relative group text-left">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Enterprise Email</label>
                                        <input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            type="email"
                                            className="luxury-input h-14 pl-5 text-lg font-semibold bg-white w-full border border-slate-200 rounded-xl"
                                            placeholder="name@company.com"
                                            aria-label="Email address"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="h-full flex flex-col items-center justify-center text-center animate-luxury-in">
                                <div className="w-28 h-28 bg-slate-900 text-white rounded-[3rem] flex items-center justify-center mb-12 shadow-2xl shadow-slate-900/30">
                                    <CheckCircle2 size={56} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter">Sequence Locked.</h2>
                                <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md mx-auto mb-16 opacity-80">
                                    Your consultation node is provisioned. Please check your secure inbox for the automated intake protocol.
                                </p>

                                <div className="p-10 rounded-2xl bg-slate-50 border border-slate-100 max-w-sm w-full mx-auto text-left shadow-sm">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-4">
                                            <span>Date</span><span className="text-slate-900">{selectedDate} DEC 2026</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-4">
                                            <span>Window</span><span className="text-slate-900">{selectedTime}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            <span>Lead Officer</span><span className="text-slate-900">{name}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ACTIONS FOOTER */}
                    {step < 3 && (
                        <div className="p-8 lg:px-16 lg:py-10 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
                            <button
                                onClick={handleBack}
                                disabled={step === 1 || isSubmitting}
                                className="flex items-center gap-2 text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-0 uppercase tracking-widest group"
                                aria-label="Go back to previous step"
                            >
                                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
                            </button>

                            {error && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-lg">
                                    <span className="text-rose-600 font-bold text-[10px] uppercase tracking-widest">{error}</span>
                                </div>
                            )}

                            <button
                                onClick={step === 2 ? handleFinalize : handleNext}
                                disabled={
                                    isSubmitting ||
                                    (step === 1 && !isStep1Valid) ||
                                    (step === 2 && !isStep2Valid)
                                }
                                className="luxury-button-primary h-14 px-10 text-[13px] flex items-center justify-center gap-3 uppercase tracking-widest shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                aria-label={step === 2 ? "Submit booking" : "Continue to next step"}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Provisioning...
                                    </>
                                ) : (
                                    <>
                                        {step === 2 ? "Finalize Strategy" : "Continue to Credentials"}
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
