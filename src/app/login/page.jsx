"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Building2,
    ArrowRight,
    Layout,
    ShieldCheck,
    Github,
    Mail,
    Lock,
    Loader2,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError("Invalid email or password.");
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

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
                            Welcome back to <span className="text-slate-400">your workspace.</span>
                        </h1>
                        <p className="text-slate-500 text-lg font-medium leading-relaxed">
                            Manage your appointments, connect with patients, and keep your Workspace running smoothly—all in one place.
                        </p>
                    </div>

                    <div className="pt-8 flex flex-col gap-6">
                        <div className="flex items-center gap-4 text-slate-400">
                            <ShieldCheck size={20} />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Your data is secure and private</span>
                        </div>
                    </div>
                </div>

                {/* Subtle base decoration */}
                <div className="absolute bottom-12 left-20 opacity-40">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">Trusted by Workspaces across India</p>
                </div>
            </div>

            {/* RIGHT SIDE: LOGIN FORM */}
            <div className="flex items-center justify-center p-8 lg:p-24 bg-white relative">
                <div className="w-full max-w-[400px] space-y-10 animate-luxury-in">
                    <div className="space-y-3 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
                        <p className="text-slate-500 text-lg font-medium">Sign in to manage your Workspace.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={18} />
                                    <input
                                        disabled={isLoading}
                                        type="email"
                                        placeholder="Enter your email"
                                        className="w-full h-12 pl-12 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all text-sm font-medium"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between pl-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                                    <a href="#" className="text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Forgot Password   </a>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={18} />
                                    <input
                                        disabled={isLoading}
                                        type="password"
                                        placeholder="Enter your password"
                                        className="w-full h-12 pl-12 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all text-sm font-medium"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
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

                        <div className="space-y-4">
                            <button
                                disabled={isLoading}
                                type="submit"
                                className="w-full h-14 bg-slate-900 text-white rounded-xl text-base font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>Sign In <ArrowRight size={20} /></>
                                )}
                            </button>

                            <p className="text-center text-[15px] text-slate-500 font-medium pt-2">
                                New here? <Link href="/onboarding" className="text-slate-900 font-bold hover:underline transition-all">Get Started</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
