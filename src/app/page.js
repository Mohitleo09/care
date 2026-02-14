"use client";

import Link from "next/link";
import {
  Layout,
  ShieldCheck,
  Activity,
  ArrowRight,
  MessageSquare,
  Calendar,
  Users,
  Layers,
  ChevronRight,
  Globe,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-slate-900 selection:text-white overflow-x-hidden">

      {/* 1. NAVIGATION */}
      <nav className="fixed top-0 w-full h-18 bg-white/80 backdrop-blur-xl border-b border-slate-50 z-50">
        <div className="max-w-7xl mx-auto h-full px-8 lg:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900">CareOps</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <Link href="/book" className="text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Patient Booking</Link>
            <Link href="/contact" className="text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Contact</Link>
          </div>

          <div className="flex items-center gap-8">
            <Link href="/login" className="text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Sign In</Link>
            <Link href="/onboarding" className="bg-slate-900 text-white h-10 px-6 rounded-lg text-[11px] font-bold hover:bg-slate-800 transition-all flex items-center shadow-lg shadow-slate-900/10 uppercase tracking-widest">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <main className="pt-40 lg:pt-48 pb-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
                Run your workspace with <span className="text-slate-400">confidence and ease.</span>
              </h1>
              <p className="text-slate-500 text-lg lg:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
                CareOps is the simple, modern workspace. Manage your team, connect with patients, and grow your clinic with ease.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/onboarding" className="bg-slate-900 text-white h-14 px-10 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2">
                Open your Workspace <ArrowRight size={18} />
              </Link>
            </div>

            {/* Capability Indicators */}
            <div className="pt-12">
              <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 border-t border-slate-50 pt-16">
                <Capability label="Team Management" icon={Users} />
                <Capability label="Operations Tracking" icon={Activity} />
                <Capability label="Client Directory" icon={Users} />
                <Capability label="Audit Protocol" icon={ShieldCheck} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 5. CORE PLATFORM GATEWAYS */}
      <section className="py-24 bg-slate-50/50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Your Workspace Hub</h2>
          <p className="text-slate-500 text-sm font-medium mt-2">Access your dashboard from anywhere.</p>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <GatewayCard
              title="Staff Dashboard"
              desc="Manage your appointments, team, and patient care in one place."
              href="/dashboard"
              icon={Globe}
              label="Sign In"
            />
            <GatewayCard
              title="Patient Booking"
              desc="Let your patients book appointments online anytime."
              href="/book"
              icon={Layers}
              label="Book Now"
            />
          </div>
        </div>
      </section>

      {/* 6. SECURITY & COMPLIANCE */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 bg-white border border-slate-100 rounded-3xl p-10 lg:p-14">
            <div className="text-center md:text-left space-y-2">
              <h4 className="text-lg font-bold text-slate-900">Secure & Reliable</h4>
              <p className="text-sm font-medium text-slate-400">Your data is protected with industry-standard encryption.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12 opacity-70">
              <SecurityItem icon={Lock} label="AES-256 Storage" />
              <SecurityItem icon={ShieldCheck} label="ISO 27001 Ready" />
              <SecurityItem icon={Activity} label="99.9% Uptime SLA" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="pt-24 pb-12 px-6 lg:px-12 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 pb-20">
            <div className="space-y-6">
              <span className="text-xl font-bold tracking-tight text-slate-900">CareOps</span>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs">
                Helping healthcare workspaces provide better care with simple, modern tools.
              </p>
            </div>

            <FooterColumn title="Platform">
              <FooterLink label="Dashboard" href="/dashboard" />
              <FooterLink label="Inbox" href="/dashboard/inbox" />
              <FooterLink label="Bookings" href="/dashboard/bookings" />
            </FooterColumn>

            <FooterColumn title="Support">
              <FooterLink label="Contact Us" href="/contact" />
              <FooterLink label="Privacy" href="#" />
              <FooterLink label="Security" href="#" />
            </FooterColumn>
          </div>

          <div className="pt-10 border-t border-slate-50 flex justify-between items-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              © {new Date().getFullYear()} CareOps. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Sub-components
function SimpleStep({ title, body }) {
  return (
    <div className="group space-y-1 border-l-2 border-slate-50 pl-6 hover:border-slate-900 transition-colors duration-300">
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <p className="text-xs text-slate-400 font-medium leading-relaxed">{body}</p>
    </div>
  )
}
function Capability({ label, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 group">
      <Icon size={18} className="text-slate-300 transition-colors" />
      <span className="text-sm font-semibold text-slate-500 transition-colors uppercase tracking-widest">{label}</span>
    </div>
  )
}

function GatewayCard({ title, desc, href, icon: Icon, label }) {
  return (
    <Link href={href} className="bg-white border border-slate-100 p-8 lg:p-12 rounded-2xl space-y-6 group hover:border-slate-300 hover:shadow-sm transition-all duration-300">
      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
        <Icon size={24} strokeWidth={2} />
      </div>
      <div className="space-y-2">
        <h4 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h4>
        <p className="text-slate-500 text-sm font-medium leading-relaxed">{desc}</p>
      </div>
      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-widest pt-2">
        {label} <ChevronRight size={14} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  )
}

function SecurityItem({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="text-slate-900" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">{label}</span>
    </div>
  )
}

function FooterColumn({ title, children }) {
  return (
    <div className="space-y-6">
      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{title}</p>
      <div className="flex flex-col gap-3">
        {children}
      </div>
    </div>
  )
}

function FooterLink({ label, href }) {
  return (
    <Link href={href} className="text-sm font-semibold text-slate-400 hover:text-slate-900 transition-colors w-fit">
      {label}
    </Link>
  )
}
