"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Layout,
    Lock,
    CheckCircle2,
    ArrowRight,
    Loader2,
    AlertCircle,
    ShieldCheck,
    Eye,
    EyeOff
} from "lucide-react";
import Link from "next/link";
import { setupPassword } from "../actions";
import { cn } from "@/lib/utils";

function SetupPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    if (!token) {
        return (
            <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                    <AlertCircle size={32} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">Invalid Link</h2>
                    <p className="text-slate-500">This password setup link is missing or broken.</p>
                </div>
                <Link href="/login" className="inline-flex items-center gap-2 text-slate-900 font-bold hover:underline transition-all">
                    Go back to Login <ArrowRight size={18} />
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password.length < 8) {
            return setError("Password must be at least 8 characters long.");
        }
        if (password !== confirmPassword) {
            return setError("Passwords do not match.");
        }

        setIsLoading(true);
        try {
            const res = await setupPassword(token, password);
            if (res.error) {
                setError(res.error);
            } else {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 size={40} className="animate-bounce" />
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Account Secured!</h2>
                    <p className="text-slate-500 text-lg font-medium">Your password has been updated. Redirecting you to login...</p>
                </div>
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-slate-300" size={24} />
                    <Link href="/login" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
                        Click here if not redirected
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-luxury-in">
            <div className="space-y-3 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Set Your Password</h2>
                <p className="text-slate-500 text-lg font-medium">Welcome to the team! Secure your account to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">New Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={18} />
                            <input
                                disabled={isLoading}
                                type={showPassword ? "text" : "password"}
                                placeholder="Min. 8 characters"
                                className="w-full h-12 pl-12 pr-12 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all text-sm font-medium"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Confirm Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={18} />
                            <input
                                disabled={isLoading}
                                type={showPassword ? "text" : "password"}
                                placeholder="Repeat your password"
                                className="w-full h-12 pl-12 pr-12 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all text-sm font-medium"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-[13px] font-bold rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <button
                    disabled={isLoading}
                    type="submit"
                    className="w-full h-14 bg-slate-900 text-white rounded-xl text-base font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-slate-200"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>Finalize Account <ArrowRight size={20} /></>
                    )}
                </button>
            </form>
        </div>
    );
}

export default function SetupPasswordPage() {
    return (
        <div className="h-screen overflow-hidden bg-white font-sans text-slate-900 grid lg:grid-cols-2">

            {/* LEFT SIDE: BRAND MESSAGE */}
            <div className="hidden lg:flex flex-col justify-center p-20 bg-slate-50 border-r border-slate-100 relative overflow-hidden">
                <div className="relative z-10 max-w-md space-y-10">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                            <Layout size={18} className="text-white" strokeWidth={2.5} />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">CareOps</span>
                    </Link>

                    <div className="space-y-6">
                        <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-slate-900">
                            Join the <br /><span className="text-slate-400">future of work.</span>
                        </h1>
                        <p className="text-slate-500 text-lg font-medium leading-relaxed">
                            You've been invited to a high-performance workspace. Secure your identity to begin delivering exceptional results.
                        </p>
                    </div>

                    <div className="pt-8 flex flex-col gap-6">
                        <div className="flex items-center gap-4 text-slate-400">
                            <ShieldCheck size={20} />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Secure Invitation Protocol</span>
                        </div>
                    </div>
                </div>

                {/* Subtle base decoration */}
                <div className="absolute bottom-12 left-20 opacity-40">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">Mumbai • Bangalore • Delhi</p>
                </div>
            </div>

            {/* RIGHT SIDE: FORM */}
            <div className="flex items-center justify-center p-8 lg:p-24 bg-white relative">
                <div className="w-full max-w-[400px]">
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="animate-spin text-slate-200" size={40} />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Validating...</p>
                        </div>
                    }>
                        <SetupPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
