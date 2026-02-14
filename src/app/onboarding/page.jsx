"use client";

import React, { useState, useTransition } from "react";
import {
    Layout,
    Building2,
    Mail,
    MessageSquare,
    Calendar,
    FileText,
    Package,
    Users,
    CheckCircle2,
    ArrowLeft,
    Loader2,
    Trash2,
    Plus,
    AlertCircle,
    Check,
    ShieldCheck,
    ChevronRight,
    Globe,
    Clock,
    MapPin,
    Settings2,
    Monitor,
    Briefcase,
    Link as LinkIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createWorkspace, updateWorkspaceConfig, verifyEmailConnection, verifySmsConnection } from "../actions";
import { cn } from "@/lib/utils";

const STEPS = [
    { id: 1, title: "Business Profile", subtitle: "Basic details" },
    { id: 2, title: "Channels", subtitle: "Email & SMS" },
    { id: 3, title: "Contact Form", subtitle: "Lead capture" },
    { id: 4, title: "Inventory", subtitle: "Resource logistics" },
    { id: 5, title: "Services", subtitle: "What you offer" },
    { id: 6, title: "Intake Forms", subtitle: "Client questionnaires" },
    { id: 7, title: "Team", subtitle: "Staff access" },
    { id: 8, title: "Launch", subtitle: "Go live" },
];

const TIME_ZONES = [
    { label: "India Standard Time (UTC+5:30)", value: "Asia/Kolkata" },
    { label: "Coordinated Universal Time (UTC)", value: "UTC" },
    { label: "Eastern Time (New York)", value: "America/New_York" },
    { label: "Pacific Time (Los Angeles)", value: "America/Los_Angeles" },
    { label: "Central Time (Chicago)", value: "America/Chicago" },
    { label: "Greenwich Mean Time (London)", value: "Europe/London" },
];

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [workspaceId, setWorkspaceId] = useState(null);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const router = useRouter();

    const [orgData, setOrgData] = useState({ name: "", email: "", password: "", timezone: "Asia/Kolkata", address: "" });
    const [connectivity, setConnectivity] = useState({
        email: { provider: "SMTP", host: "", user: "", pass: "", port: "587", secure: false, active: false },
        sms: { provider: "Twilio", sid: "", token: "", from: "", active: false }
    });
    const [contactForm, setContactForm] = useState({
        name: "",
        emailRequired: true,
        phoneRequired: false,
        autoMessage: "",
        channelPriority: "EMAIL",
        isPublished: true
    });
    const DEFAULT_SERVICE = {
        name: "",
        description: "",
        duration: 30,
        bufferTime: 5,
        locationType: "ONLINE",
        location: "",
        availability: {
            monday: { active: true, start: "09:00", end: "17:00" },
            tuesday: { active: true, start: "09:00", end: "17:00" },
            wednesday: { active: true, start: "09:00", end: "17:00" },
            thursday: { active: true, start: "09:00", end: "17:00" },
            friday: { active: true, start: "09:00", end: "17:00" },
            saturday: { active: false, start: "09:00", end: "17:00" },
            sunday: { active: false, start: "09:00", end: "17:00" },
        },
        resourceRequirements: []
    };

    const DEFAULT_FORM = {
        name: "",
        description: "",
        fields: [
            { type: "text", label: "Full Name", required: true },
            { type: "textarea", label: "Reason for Appointment", required: true }
        ]
    };

    const [services, setServices] = useState([]);
    const [activeServiceIdx, setActiveServiceIdx] = useState(0);
    const [activeForms, setActiveForms] = useState([]);
    const [activeFormIdx, setActiveFormIdx] = useState(0);
    const [inventory, setInventory] = useState([]);
    const [team, setTeam] = useState([]);
    const [newTeamMember, setNewTeamMember] = useState({ email: "", role: "STAFF" });

    // Local loading states for sub-actions to avoid shared isPending UI conflicts
    const [verifyingEmail, setVerifyingEmail] = useState(false);
    const [verifyingSms, setVerifyingSms] = useState(false);

    const handleNext = async () => {
        setError("");
        setSuccessMsg("");

        // Validation for critical step
        if (currentStep === 1 && (!orgData.name || !orgData.email || !orgData.password)) {
            return setError("Required fields (Name, Email, Password) must be completed.");
        }

        // STEP 1: Blocking - needs Workspace ID
        if (currentStep === 1) {
            startTransition(async () => {
                try {
                    const formData = new FormData();
                    Object.entries(orgData).forEach(([k, v]) => formData.append(k, v));
                    const res = await createWorkspace(formData);
                    if (res.error) {
                        if (res.existing) {
                            setError(res.error);
                            setSuccessMsg("You already have an active workspace. Please log in.");
                        }
                        return setError(res.error);
                    }

                    if (res.workspaceId) setWorkspaceId(res.workspaceId);

                    if (res.existing && res.data) {
                        const { data } = res;
                        if (data.orgData) setOrgData(prev => ({ ...prev, ...data.orgData }));

                        // 1. Connectivity
                        if (data.channels) {
                            const newConn = { ...connectivity };
                            data.channels.forEach(ch => {
                                if (ch.type === "EMAIL") {
                                    newConn.email = { ...ch.config, active: true };
                                } else if (ch.type === "SMS") {
                                    newConn.sms = { ...ch.config, active: true };
                                }
                            });
                            setConnectivity(newConn);
                        }

                        // 2. Contact Form
                        if (data.contactForms && data.contactForms.length > 0) {
                            const cf = data.contactForms[0];
                            setContactForm({
                                ...cf.settings,
                                name: cf.name
                            });
                        }

                        // 3. Services
                        if (data.serviceTypes && data.serviceTypes.length > 0) {
                            const mappedServices = data.serviceTypes.map(s => {
                                const availability = {};
                                // Set defaults
                                ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].forEach(d => {
                                    availability[d] = { active: false, start: "09:00", end: "17:00" };
                                });

                                s.availability?.forEach(av => {
                                    const day = av.dayOfWeek.toLowerCase();
                                    if (availability[day]) {
                                        availability[day] = { active: true, start: av.startTime, end: av.endTime };
                                    }
                                });

                                return {
                                    name: s.name,
                                    description: s.description || "",
                                    duration: s.duration,
                                    bufferTime: s.bufferTime,
                                    locationType: s.locationType,
                                    location: s.location || "",
                                    availability
                                };
                            });
                            setServices(mappedServices);
                        }

                        // 4. Client Questionnaires
                        if (data.formTemplates && data.formTemplates.length > 0) {
                            setActiveForms(data.formTemplates.map(f => ({
                                name: f.name,
                                description: f.description || "",
                                fields: f.fields || []
                            })));
                        }

                        // 5. Inventory
                        if (data.inventory && data.inventory.length > 0) {
                            setInventory(data.inventory.map(i => ({
                                name: i.name,
                                quantity: i.totalQuantity
                            })));
                        }

                        // 6. Team
                        if (data.team && data.team.length > 0) {
                            setTeam(data.team.filter(u => u.role !== 'OWNER').map(u => ({
                                name: u.name,
                                email: u.email,
                                role: u.role
                            })));
                        }

                        setSuccessMsg("Found existing configuration. Resuming from where you left off.");
                        setCurrentStep(res.onboardingStep || 2);
                    } else {
                        setCurrentStep(2);
                    }
                } catch (err) { setError("Setup failed. Please check your information."); }
            });
            return;
        }

        // STEP 8: Blocking - Final redirect
        if (currentStep === 8) {
            startTransition(async () => {
                try {
                    const res = await updateWorkspaceConfig(workspaceId, 8, {});
                    if (res.error) return setError(res.error);
                    router.push("/dashboard");
                } catch (err) { setError("Final setup failed."); }
            });
            return;
        }

        // INTERMEDIATE STEPS (2-7): Optimistic / Background Save
        let data = {};
        if (currentStep === 2) {
            const channels = [];
            if (connectivity.email.active) channels.push({ type: "EMAIL", provider: "SMTP", config: connectivity.email });
            if (connectivity.sms.active) channels.push({ type: "SMS", provider: "Twilio", config: connectivity.sms });
            data = { channels };
        } else if (currentStep === 3) data = { ...contactForm };
        else if (currentStep === 4) data = { inventory };
        else if (currentStep === 5) data = { services };
        else if (currentStep === 6) data = { forms: activeForms };
        else if (currentStep === 7) data = { staff: team };

        const stepToSave = currentStep;
        // Instant UI Transition
        setCurrentStep(prev => prev + 1);

        // Background Sync using Transition to keep isPending active (prevents premature double clicks)
        startTransition(async () => {
            try {
                const res = await updateWorkspaceConfig(workspaceId, stepToSave, data);
                if (res.error) {
                    console.error("Background sync error:", res.error);
                    // Silent failure in UI for speed, but log for dev
                }
            } catch (err) { console.error("Critical sync failure:", err); }
        });
    };

    return (
        <div className="h-screen h-[100dvh] bg-[#F8FAFC] flex flex-col font-sans text-slate-900 antialiased overflow-hidden">
            {/* Top Navigation - Fixed Height */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-50 relative">
                <div className="absolute bottom-0 left-0 h-0.5 bg-slate-900 transition-all duration-500 ease-out" style={{ width: `${(currentStep / STEPS.length) * 100}%` }} />
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center">
                        <Building2 className="text-white" size={18} />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-800">CareOps</span>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                    Step {currentStep} of {STEPS.length}
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Simple Sidebar - Scrollable independently */}
                <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col p-8 shrink-0 overflow-y-auto no-scrollbar">
                    <div className="space-y-1">
                        {STEPS.map((s) => (
                            <div key={s.id} className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                                currentStep === s.id ? "bg-slate-100 text-slate-900" : "text-slate-500 opacity-80"
                            )}>
                                <div className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] border",
                                    currentStep === s.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"
                                )}>
                                    {s.id < currentStep ? <Check size={12} strokeWidth={3} /> : s.id}
                                </div>
                                <span className="flex-1">{s.title}</span>
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
                    {/* Content Area - Independently Scrollable */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                        <div className={cn("w-full mx-auto px-6 py-12 md:py-16 transition-all duration-500", [4, 5, 6, 7].includes(currentStep) ? "max-w-6xl" : (currentStep === 3 ? "max-w-4xl" : "max-w-2xl"))}>
                            {/* Step Navigation Header */}
                            <div className="mb-12 space-y-2">
                                <h1 className="text-3xl font-bold text-slate-900">{STEPS[currentStep - 1].title}</h1>
                                <p className="text-slate-500 text-lg font-normal">{STEPS[currentStep - 1].subtitle}</p>
                            </div>

                            {/* Content Area */}
                            <div key={currentStep} className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-300 ease-out">
                                {currentStep === 1 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-right-8 duration-500">
                                        <div className="space-y-10">
                                            <div className="space-y-1 pb-6 border-b border-slate-100">
                                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Business details</h3>
                                                <p className="text-sm text-slate-500">The basic info for your new workspace.</p>
                                            </div>
                                            <div className="space-y-8">
                                                <InputBlock label="Business Name" value={orgData.name} onChange={v => setOrgData({ ...orgData, name: v })} placeholder="e.g., Gotham Health Center" />
                                                <InputBlock label="Admin Email" value={orgData.email} onChange={v => setOrgData({ ...orgData, email: v })} placeholder="admin@workspace.io" />
                                                <InputBlock label="Password" value={orgData.password} onChange={v => setOrgData({ ...orgData, password: v })} type="password" placeholder="••••••••" />
                                            </div>
                                        </div>
                                        <div className="space-y-10">
                                            <div className="space-y-1 pb-6 border-b border-slate-100">
                                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Location & Time</h3>
                                                <p className="text-sm text-slate-500">Where you are and when you work.</p>
                                            </div>
                                            <div className="space-y-8">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700 ml-0.5">Timezone</label>
                                                    <select
                                                        className="input-base"
                                                        value={orgData.timezone}
                                                        onChange={e => setOrgData({ ...orgData, timezone: e.target.value })}
                                                    >
                                                        {TIME_ZONES.map(tz => (
                                                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <InputBlock label="Address" value={orgData.address} onChange={v => setOrgData({ ...orgData, address: v })} placeholder="Full physical address" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                                        <div className="space-y-1 pb-6 border-b border-slate-100">
                                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Connect apps</h3>
                                            <p className="text-sm text-slate-500">Set up how you'll send notifications and alerts.</p>
                                        </div>

                                        <div className="space-y-8">
                                            <ChannelBox
                                                isActive={connectivity.email.active}
                                                title="Email (SMTP)"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                                                    <InputBlock label="SMTP Host" value={connectivity.email.host} onChange={v => setConnectivity({ ...connectivity, email: { ...connectivity.email, host: v, active: false } })} placeholder="e.g., smtp.gmail.com" />
                                                    <InputBlock label="Port" value={connectivity.email.port} onChange={v => setConnectivity({ ...connectivity, email: { ...connectivity.email, port: v, active: false } })} placeholder="587" />
                                                    <InputBlock label="Email Address" value={connectivity.email.user} onChange={v => setConnectivity({ ...connectivity, email: { ...connectivity.email, user: v, active: false } })} placeholder="sender@clinic.io" />
                                                    <InputBlock label="App Password" value={connectivity.email.pass} onChange={v => setConnectivity({ ...connectivity, email: { ...connectivity.email, pass: v, active: false } })} type="password" placeholder="••••••••" />
                                                </div>
                                                <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Tip: For Gmail/Outlook, you'll need an App Password.</p>
                                                    <button
                                                        onClick={async () => {
                                                            setError("");
                                                            setVerifyingEmail(true);
                                                            try {
                                                                const res = await verifyEmailConnection(connectivity.email);
                                                                if (res.error) setError(`Email failed: ${res.error}`);
                                                                else {
                                                                    setConnectivity({ ...connectivity, email: { ...connectivity.email, active: true } });
                                                                    setSuccessMsg("Email connected!");
                                                                }
                                                            } catch (err) { setError("Something went wrong."); }
                                                            setVerifyingEmail(false);
                                                        }}
                                                        disabled={verifyingEmail || connectivity.email.active}
                                                        className={cn(
                                                            "px-6 h-10 rounded-md text-[13px] font-bold transition-all",
                                                            connectivity.email.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-900 text-white hover:bg-slate-800"
                                                        )}
                                                    >
                                                        {verifyingEmail ? <Loader2 className="animate-spin" size={14} /> : connectivity.email.active ? "Connected" : "Test Connection"}
                                                    </button>
                                                </div>
                                            </ChannelBox>

                                            <ChannelBox
                                                isActive={connectivity.sms.active}
                                                title="SMS (Twilio)"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                                                    <InputBlock label="Account SID" value={connectivity.sms.sid} onChange={v => setConnectivity({ ...connectivity, sms: { ...connectivity.sms, sid: v, active: false } })} placeholder="AC..." />
                                                    <InputBlock label="Auth Token" value={connectivity.sms.token} onChange={v => setConnectivity({ ...connectivity, sms: { ...connectivity.sms, token: v, active: false } })} type="password" placeholder="••••••••" />
                                                </div>
                                                <div className="mt-8 flex justify-end pt-6 border-t border-slate-100">
                                                    <button
                                                        onClick={async () => {
                                                            setError("");
                                                            setVerifyingSms(true);
                                                            try {
                                                                const res = await verifySmsConnection(connectivity.sms);
                                                                if (res.error) setError(`SMS failed: ${res.error}`);
                                                                else {
                                                                    setConnectivity({ ...connectivity, sms: { ...connectivity.sms, active: true } });
                                                                    setSuccessMsg("SMS connected!");
                                                                }
                                                            } catch (err) { setError("Something went wrong."); }
                                                            setVerifyingSms(false);
                                                        }}
                                                        disabled={verifyingSms || connectivity.sms.active}
                                                        className={cn(
                                                            "px-6 h-10 rounded-md text-[13px] font-bold transition-all",
                                                            connectivity.sms.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-900 text-white hover:bg-slate-800"
                                                        )}
                                                    >
                                                        {verifyingSms ? <Loader2 className="animate-spin" size={14} /> : connectivity.sms.active ? "Connected" : "Test Connection"}
                                                    </button>
                                                </div>
                                            </ChannelBox>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                            <div className="space-y-1">
                                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Inquiry Form</h3>
                                                <p className="text-sm text-slate-500">Create a form for new clients to find you.</p>
                                            </div>
                                            {!contactForm.isPublished && (
                                                <button
                                                    onClick={() => {
                                                        if (!contactForm.emailRequired && !contactForm.phoneRequired) {
                                                            return setError("Require Email or Phone to continue.");
                                                        }
                                                        setContactForm({ ...contactForm, isPublished: true });
                                                        setSuccessMsg("Form published!");
                                                    }}
                                                    className="bg-slate-900 text-white px-8 h-10 rounded-md text-[13px] font-bold hover:bg-slate-800 transition-all shadow-sm"
                                                >
                                                    Publish Form
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                                            <div className="space-y-10">
                                                <div className="space-y-2 pb-6 border-b border-slate-100">
                                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Form Fields</h4>
                                                    <p className="text-sm text-slate-500">Choose the info you want to collect.</p>
                                                </div>
                                                <div className="space-y-1">
                                                    {[
                                                        { id: 'name', label: 'Full Name', required: true, disabled: true },
                                                        { id: 'email', label: 'Email Address', required: contactForm.emailRequired, toggle: () => setContactForm({ ...contactForm, emailRequired: !contactForm.emailRequired }) },
                                                        { id: 'phone', label: 'Phone Number', required: contactForm.phoneRequired, toggle: () => setContactForm({ ...contactForm, phoneRequired: !contactForm.phoneRequired }) },
                                                        { id: 'msg', label: 'Short Message', required: false, disabled: true }
                                                    ].map((f) => (
                                                        <div key={f.id} className="flex items-center justify-between py-5 border-b border-slate-50">
                                                            <div className="space-y-0.5">
                                                                <span className="text-[13px] font-bold text-slate-700">{f.label}</span>
                                                                <p className="text-[10px] text-slate-400 font-medium">{f.disabled ? "Required" : "You can toggle this"}</p>
                                                            </div>
                                                            <button
                                                                onClick={f.toggle}
                                                                disabled={f.disabled}
                                                                className={cn(
                                                                    "text-[10px] font-black uppercase tracking-tighter transition-all px-4 py-1.5 rounded-full border",
                                                                    f.required ? "text-slate-900 bg-slate-50 border-slate-200" : "text-slate-300 border-transparent hover:text-slate-500"
                                                                )}
                                                            >
                                                                {f.required ? "Required" : "Optional"}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-10">
                                                <div className="space-y-2 pb-6 border-b border-slate-100">
                                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Settings</h4>
                                                    <p className="text-sm text-slate-500">How the form behaves after submission.</p>
                                                </div>
                                                <div className="space-y-10">
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto-reply message</label>
                                                        <textarea
                                                            className="w-full min-h-[140px] bg-white border border-slate-200 rounded-xl p-5 text-[14px] font-medium text-slate-600 placeholder:text-slate-200 focus:border-slate-900 outline-none transition-all resize-none"
                                                            value={contactForm.autoMessage}
                                                            onChange={e => setContactForm({ ...contactForm, autoMessage: e.target.value })}
                                                            placeholder="e.g., Thanks! We've received your message and will get back to you soon."
                                                        />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Send alerts to</label>
                                                        <select
                                                            className="input-base"
                                                            value={contactForm.channelPriority}
                                                            onChange={e => setContactForm({ ...contactForm, channelPriority: e.target.value })}
                                                        >
                                                            <option value="EMAIL">Email</option>
                                                            <option value="SMS">SMS</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {contactForm.isPublished && (
                                            <div className="pt-16 border-t border-slate-100 space-y-8 animate-in fade-in slide-in-from-bottom-6">
                                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Your form links</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Globe size={11} /> Form URL
                                                        </label>
                                                        <div className="h-12 bg-slate-50 flex items-center px-4 rounded-lg text-sm font-bold text-slate-900 border border-slate-100 select-all cursor-copy">
                                                            careops.io/u/{workspaceId?.substring(0, 8) || "..."}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <LinkIcon size={11} /> Embed Script
                                                        </label>
                                                        <div className="h-12 bg-slate-900 flex items-center px-4 rounded-lg text-[10px] font-mono text-slate-300 truncate border border-slate-800">
                                                            &lt;iframe src="..." width="100%" height="450"&gt;&lt;/iframe&gt;
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {currentStep === 4 && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500 max-w-6xl mx-auto">
                                        <div className="space-y-8">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-bold text-slate-900">Resource Logistics</h3>
                                                    <p className="text-sm text-slate-500">Define the items and capacity required to fulfill bookings.</p>
                                                </div>
                                                <button
                                                    onClick={() => setInventory([...inventory, { name: "", quantity: 1, type: "CONSUMABLE", threshold: 1 }])}
                                                    className="bg-slate-900 text-white h-9 px-4 rounded-md text-[13px] font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                                                >
                                                    <Plus size={14} /> Add Resource
                                                </button>
                                            </div>

                                            <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 overflow-hidden shadow-sm bg-white">
                                                <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b border-slate-100 italic">
                                                    <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resource Name</div>
                                                    <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</div>
                                                    <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty/Capacity</div>
                                                    <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Threshold</div>
                                                    <div className="col-span-1"></div>
                                                </div>
                                                {inventory.map((item, i) => (
                                                    <div key={i} className="grid grid-cols-12 items-center gap-4 px-6 py-5 hover:bg-slate-50/50 transition-colors">
                                                        <div className="col-span-4">
                                                            <input
                                                                className="w-full h-10 bg-transparent text-[14px] font-bold text-slate-900 placeholder:text-slate-300 outline-none"
                                                                value={item.name}
                                                                onChange={v => { const n = [...inventory]; n[i].name = v.target.value; setInventory(n); }}
                                                                placeholder="e.g., Hair Product Kit"
                                                            />
                                                        </div>
                                                        <div className="col-span-3">
                                                            <select
                                                                className="w-full h-10 bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
                                                                value={item.type}
                                                                onChange={v => { const n = [...inventory]; n[i].type = v.target.value; setInventory(n); }}
                                                            >
                                                                <option value="CONSUMABLE">Consumable (Stock)</option>
                                                                <option value="REUSABLE">Reusable (Resource)</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <input
                                                                type="number"
                                                                className="w-full h-10 bg-transparent text-[14px] font-bold text-slate-900 outline-none"
                                                                value={item.quantity}
                                                                onChange={v => { const n = [...inventory]; n[i].quantity = parseInt(v.target.value) || 0; setInventory(n); }}
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <input
                                                                type="number"
                                                                className="w-full h-10 bg-transparent text-[14px] font-bold text-slate-900 outline-none"
                                                                value={item.threshold}
                                                                onChange={v => { const n = [...inventory]; n[i].threshold = parseInt(v.target.value) || 0; setInventory(n); }}
                                                                disabled={item.type === 'REUSABLE'}
                                                                placeholder={item.type === 'REUSABLE' ? 'N/A' : '5'}
                                                            />
                                                        </div>
                                                        <div className="col-span-1 text-right">
                                                            <button
                                                                onClick={() => { const n = inventory.filter((_, idx) => idx !== i); setInventory(n); }}
                                                                className="text-slate-200 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {inventory.length === 0 && (
                                                    <div className="py-20 text-center space-y-3">
                                                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-300">
                                                            <Package size={20} />
                                                        </div>
                                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No resources cataloged</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 5 && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                                        {services.length === 0 ? (
                                            <div className="py-24 flex flex-col items-center justify-center bg-white border border-slate-100 rounded-2xl space-y-8">
                                                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center border border-slate-100">
                                                    <Calendar size={32} strokeWidth={1.5} />
                                                </div>
                                                <div className="text-center space-y-2">
                                                    <h2 className="text-xl font-bold text-slate-900">What services do you offer?</h2>
                                                    <p className="text-slate-400 text-sm max-w-xs mx-auto">Set up the types of appointments clients can book with you.</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setServices([DEFAULT_SERVICE]);
                                                        setActiveServiceIdx(0);
                                                    }}
                                                    className="bg-slate-900 text-white px-8 h-10 rounded-md text-[13px] font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                                                >
                                                    <Plus size={16} /> Create First Service
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-12">
                                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                                    <div className="flex gap-10">
                                                        {services.map((s, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => setActiveServiceIdx(i)}
                                                                className={cn(
                                                                    "pb-4 text-[13px] font-bold tracking-tight transition-all relative",
                                                                    activeServiceIdx === i ? "text-slate-900" : "text-slate-300 hover:text-slate-500"
                                                                )}
                                                            >
                                                                {s.name || `Unnamed Service`}
                                                                {activeServiceIdx === i && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-full" />}
                                                            </button>
                                                        ))}
                                                        <button
                                                            onClick={() => {
                                                                setServices([...services, DEFAULT_SERVICE]);
                                                                setActiveServiceIdx(services.length);
                                                            }}
                                                            className="pb-4 text-[13px] font-bold text-slate-200 hover:text-slate-400 transition-all"
                                                        >
                                                            + New Service
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const n = services.filter((_, idx) => idx !== activeServiceIdx);
                                                            setServices(n);
                                                            setActiveServiceIdx(Math.max(0, activeServiceIdx - 1));
                                                        }}
                                                        className="pb-5 text-slate-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                                                    <div className="space-y-12">
                                                        <div className="space-y-8">
                                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">General Info</label>
                                                            <div className="space-y-6">
                                                                <input
                                                                    className="w-full h-12 border-b border-slate-200 text-xl font-bold text-slate-900 placeholder:text-slate-200 focus:border-slate-900 outline-none transition-all pb-2 bg-transparent"
                                                                    value={services[activeServiceIdx].name}
                                                                    onChange={e => { const n = [...services]; n[activeServiceIdx].name = e.target.value; setServices(n); }}
                                                                    placeholder="Service Name"
                                                                />
                                                                <div className="grid grid-cols-2 gap-8">
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration (min)</label>
                                                                        <input
                                                                            type="number"
                                                                            className="w-full h-10 bg-transparent text-[15px] font-bold text-slate-900 border-b border-slate-100 focus:border-slate-900 outline-none"
                                                                            value={services[activeServiceIdx].duration}
                                                                            onChange={e => { const n = [...services]; n[activeServiceIdx].duration = e.target.value; setServices(n); }}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Buffer (min)</label>
                                                                        <input
                                                                            type="number"
                                                                            className="w-full h-10 bg-transparent text-[15px] font-bold text-slate-900 border-b border-slate-100 focus:border-slate-900 outline-none"
                                                                            value={services[activeServiceIdx].bufferTime}
                                                                            onChange={e => { const n = [...services]; n[activeServiceIdx].bufferTime = e.target.value; setServices(n); }}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4 pt-4">
                                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                                                        Resource Requirements
                                                                        <span className="text-[10px] font-medium lowercase text-slate-400">Linked to Inventory</span>
                                                                    </label>
                                                                    <div className="space-y-3">
                                                                        {inventory.map((invItem, invIdx) => {
                                                                            const req = services[activeServiceIdx].resourceRequirements?.find(r => r.name === invItem.name);
                                                                            return (
                                                                                <div key={invIdx} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className={cn(
                                                                                            "w-2 h-2 rounded-full",
                                                                                            req ? "bg-slate-900 shadow-[0_0_8px_rgba(15,23,42,0.3)]" : "bg-slate-200"
                                                                                        )} />
                                                                                        <span className={cn(
                                                                                            "text-sm font-semibold transition-colors",
                                                                                            req ? "text-slate-900" : "text-slate-400"
                                                                                        )}>{invItem.name} <span className="text-[10px] opacity-50 ml-1">({invItem.type})</span></span>
                                                                                    </div>
                                                                                    {req ? (
                                                                                        <div className="flex items-center gap-4">
                                                                                            <span className="text-[10px] font-black uppercase text-slate-400">Required</span>
                                                                                            <input
                                                                                                type="number"
                                                                                                className="w-12 h-8 bg-white border border-slate-200 rounded text-center text-xs font-bold"
                                                                                                value={req.quantity}
                                                                                                onChange={e => {
                                                                                                    const n = [...services];
                                                                                                    const rIdx = n[activeServiceIdx].resourceRequirements.findIndex(r => r.name === invItem.name);
                                                                                                    n[activeServiceIdx].resourceRequirements[rIdx].quantity = parseInt(e.target.value) || 1;
                                                                                                    setServices(n);
                                                                                                }}
                                                                                            />
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    const n = [...services];
                                                                                                    n[activeServiceIdx].resourceRequirements = n[activeServiceIdx].resourceRequirements.filter(r => r.name !== invItem.name);
                                                                                                    setServices(n);
                                                                                                }}
                                                                                                className="text-slate-300 hover:text-red-500"
                                                                                            >
                                                                                                <Trash2 size={14} />
                                                                                            </button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                const n = [...services];
                                                                                                if (!n[activeServiceIdx].resourceRequirements) n[activeServiceIdx].resourceRequirements = [];
                                                                                                n[activeServiceIdx].resourceRequirements.push({ name: invItem.name, quantity: 1 });
                                                                                                setServices(n);
                                                                                            }}
                                                                                            className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest"
                                                                                        >
                                                                                            + Attach
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                        {inventory.length === 0 && (
                                                                            <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center">
                                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No inventory items available to link</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-8">
                                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Where & How</label>
                                                            <div className="space-y-8">
                                                                <div className="flex gap-4">
                                                                    <button
                                                                        onClick={() => { const n = [...services]; n[activeServiceIdx].locationType = "ONLINE"; setServices(n); }}
                                                                        className={cn(
                                                                            "flex-1 py-3 px-4 rounded-lg border text-sm font-bold transition-all",
                                                                            services[activeServiceIdx].locationType === "ONLINE" ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-500"
                                                                        )}
                                                                    >
                                                                        Online Meeting
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { const n = [...services]; n[activeServiceIdx].locationType = "IN_PERSON"; setServices(n); }}
                                                                        className={cn(
                                                                            "flex-1 py-3 px-4 rounded-lg border text-sm font-bold transition-all",
                                                                            services[activeServiceIdx].locationType === "IN_PERSON" ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-500"
                                                                        )}
                                                                    >
                                                                        In-person Visit
                                                                    </button>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Link or Address</label>
                                                                    <input
                                                                        className="w-full h-10 bg-transparent text-[15px] font-medium text-slate-600 border-b border-slate-100 focus:border-slate-900 outline-none"
                                                                        value={services[activeServiceIdx].location}
                                                                        onChange={e => { const n = [...services]; n[activeServiceIdx].location = e.target.value; setServices(n); }}
                                                                        placeholder={services[activeServiceIdx].locationType === "ONLINE" ? "Meeting link or platform" : "Clinic address / suite"}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-8 bg-slate-50/50 p-8 rounded-2xl border border-slate-50">
                                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Weekly Schedule</label>
                                                        <div className="space-y-2">
                                                            {Object.entries(services[activeServiceIdx].availability).map(([day, config]) => (
                                                                <div key={day} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                                                                    <button
                                                                        onClick={() => {
                                                                            const n = [...services];
                                                                            n[activeServiceIdx].availability[day].active = !config.active;
                                                                            setServices(n);
                                                                        }}
                                                                        className={cn(
                                                                            "text-[13px] font-bold w-12 text-left transition-colors",
                                                                            config.active ? "text-slate-900" : "text-slate-200"
                                                                        )}
                                                                    >
                                                                        {day.slice(0, 3).toUpperCase()}
                                                                    </button>
                                                                    {config.active ? (
                                                                        <div className="flex items-center gap-4">
                                                                            <input
                                                                                type="time"
                                                                                value={config.start}
                                                                                onChange={e => {
                                                                                    const n = [...services];
                                                                                    n[activeServiceIdx].availability[day].start = e.target.value;
                                                                                    setServices(n);
                                                                                }}
                                                                                className="bg-transparent text-[13px] font-bold text-slate-900 outline-none"
                                                                            />
                                                                            <span className="text-slate-200 text-xs">—</span>
                                                                            <input
                                                                                type="time"
                                                                                value={config.end}
                                                                                onChange={e => {
                                                                                    const n = [...services];
                                                                                    n[activeServiceIdx].availability[day].end = e.target.value;
                                                                                    setServices(n);
                                                                                }}
                                                                                className="bg-transparent text-[13px] font-bold text-slate-900 outline-none"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[10px] font-black text-slate-200 uppercase tracking-tighter">Inactive</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {currentStep === 6 && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                                        {activeForms.length === 0 ? (
                                            <div className="py-24 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-8">
                                                <div className="text-center space-y-2">
                                                    <h2 className="text-2xl font-bold text-slate-900">Client Questionnaires</h2>
                                                    <p className="text-slate-500 max-w-sm mx-auto">Create forms for clients to fill out before their visit.</p>
                                                </div>
                                                <button
                                                    onClick={() => { setActiveForms([DEFAULT_FORM]); setActiveFormIdx(0); }}
                                                    className="bg-slate-900 text-white px-8 h-12 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                                                >
                                                    <Plus size={18} />
                                                    Add First Form
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-12">
                                                {/* Header & Tabs */}
                                                <div className="flex items-center justify-between border-b border-slate-200">
                                                    <div className="flex gap-10">
                                                        {activeForms.map((f, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => setActiveFormIdx(i)}
                                                                className={cn(
                                                                    "pb-5 text-sm font-bold border-b-2 transition-all",
                                                                    activeFormIdx === i ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
                                                                )}
                                                            >
                                                                {f.name || `Unnamed Form`}
                                                            </button>
                                                        ))}
                                                        <button
                                                            onClick={() => {
                                                                setActiveForms([...activeForms, DEFAULT_FORM]);
                                                                setActiveFormIdx(activeForms.length);
                                                            }}
                                                            className="pb-5 text-sm font-bold text-slate-400 hover:text-slate-900"
                                                        >
                                                            + New Template
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const n = activeForms.filter((_, idx) => idx !== activeFormIdx);
                                                            setActiveForms(n);
                                                            setActiveFormIdx(Math.max(0, activeFormIdx - 1));
                                                        }}
                                                        className="pb-5 text-slate-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="space-y-20">
                                                    {/* Basic Info */}
                                                    <div className="flex flex-col md:flex-row gap-16">
                                                        <div className="flex-1 space-y-2">
                                                            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Name</label>
                                                            <input
                                                                className="w-full h-12 border-b border-slate-200 text-xl font-bold text-slate-900 placeholder:text-slate-200 focus:border-slate-900 outline-none transition-all pb-2 bg-transparent"
                                                                value={activeForms[activeFormIdx].name}
                                                                onChange={e => { const n = [...activeForms]; n[activeFormIdx].name = e.target.value; setActiveForms(n); }}
                                                                placeholder="e.g., Medical History Form"
                                                            />
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                                                            <input
                                                                className="w-full h-12 border-b border-slate-200 text-base font-bold text-slate-900 placeholder:text-slate-200 focus:border-slate-900 outline-none transition-all pb-2 bg-transparent"
                                                                value={activeForms[activeFormIdx].description}
                                                                onChange={e => { const n = [...activeForms]; n[activeFormIdx].description = e.target.value; setActiveForms(n); }}
                                                                placeholder="Context"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-8">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="text-xl font-bold text-slate-900">Fields</h3>
                                                            <button
                                                                onClick={() => {
                                                                    const n = [...activeForms];
                                                                    n[activeFormIdx].fields.push({ type: "text", label: "", required: true });
                                                                    setActiveForms(n);
                                                                }}
                                                                className="bg-slate-900 text-white h-9 px-4 rounded-md text-[13px] font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                                                            >
                                                                <Plus size={14} /> Add Field
                                                            </button>
                                                        </div>

                                                        <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 overflow-hidden">
                                                            {activeForms[activeFormIdx].fields.map((field, fIdx) => (
                                                                <div key={fIdx} className="flex flex-col md:flex-row items-center gap-8 p-6 bg-white hover:bg-slate-50/50 transition-colors">
                                                                    <div className="flex-[3] w-full">
                                                                        <input
                                                                            className="w-full h-10 bg-transparent text-[15px] font-bold text-slate-900 placeholder:text-slate-300 outline-none"
                                                                            value={field.label}
                                                                            onChange={v => {
                                                                                const n = [...activeForms];
                                                                                n[activeFormIdx].fields[fIdx].label = v.target.value;
                                                                                setActiveForms(n);
                                                                            }}
                                                                            placeholder="Enter question label..."
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 w-full">
                                                                        <select
                                                                            className="w-full h-10 bg-transparent text-sm font-bold text-slate-600 outline-none appearance-none cursor-pointer"
                                                                            value={field.type}
                                                                            onChange={e => {
                                                                                const n = [...activeForms];
                                                                                n[activeFormIdx].fields[fIdx].type = e.target.value;
                                                                                setActiveForms(n);
                                                                            }}
                                                                        >
                                                                            <option value="text">Short Text</option>
                                                                            <option value="textarea">Long Form</option>
                                                                            <option value="date">Calendar Date</option>
                                                                            <option value="number">Numeric Input</option>
                                                                            <option value="checkbox">Toggle / Check</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="flex items-center gap-8">
                                                                        <button
                                                                            onClick={() => {
                                                                                const n = [...activeForms];
                                                                                n[activeFormIdx].fields[fIdx].required = !field.required;
                                                                                setActiveForms(n);
                                                                            }}
                                                                            className={cn(
                                                                                "text-[11px] font-black uppercase tracking-tighter transition-all",
                                                                                field.required ? "text-slate-900" : "text-slate-300 hover:text-slate-400"
                                                                            )}
                                                                        >
                                                                            {field.required ? "Required" : "Optional"}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                const n = [...activeForms];
                                                                                n[activeFormIdx].fields.splice(fIdx, 1);
                                                                                setActiveForms(n);
                                                                            }}
                                                                            className="text-slate-200 hover:text-red-500 transition-colors"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {currentStep === 7 && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                                        <div className="space-y-8">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-bold text-slate-900">Team Setup</h3>
                                                    <p className="text-sm text-slate-500">Add your staff and choose who helps manage the system.</p>
                                                </div>
                                                <button
                                                    onClick={() => setTeam([...team, { name: "", email: "", role: "STAFF" }])}
                                                    className="bg-slate-900 text-white h-9 px-4 rounded-md text-[13px] font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                                                >
                                                    <Plus size={14} /> Add Member
                                                </button>
                                            </div>

                                            <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 overflow-hidden">
                                                {team.map((member, i) => (
                                                    <div key={i} className="flex flex-col md:flex-row items-center gap-8 p-6 bg-white hover:bg-slate-50/50 transition-colors">
                                                        <div className="flex-1 w-full">
                                                            <input
                                                                className="w-full h-10 bg-transparent text-[15px] font-bold text-slate-900 placeholder:text-slate-300 outline-none"
                                                                value={member.name}
                                                                onChange={v => { const n = [...team]; n[i].name = v.target.value; setTeam(n); }}
                                                                placeholder="Full Name"
                                                            />
                                                        </div>
                                                        <div className="flex-1 w-full">
                                                            <input
                                                                className="w-full h-10 bg-transparent text-[15px] font-semibold text-slate-600 placeholder:text-slate-200 outline-none"
                                                                value={member.email}
                                                                onChange={v => { const n = [...team]; n[i].email = v.target.value; setTeam(n); }}
                                                                placeholder="Email address"
                                                            />
                                                        </div>
                                                        <div className="flex-1 w-full">
                                                            <select
                                                                className="w-full h-10 bg-transparent text-sm font-bold text-slate-600 outline-none appearance-none cursor-pointer"
                                                                value={member.role}
                                                                onChange={e => { const n = [...team]; n[i].role = e.target.value; setTeam(n); }}
                                                            >
                                                                <option value="STAFF">Staff Member</option>
                                                                <option value="ADMIN">System Admin</option>
                                                            </select>
                                                        </div>
                                                        <button
                                                            onClick={() => { const n = team.filter((_, idx) => idx !== i); setTeam(n); }}
                                                            className="text-slate-200 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {team.length === 0 && (
                                                    <div className="py-12 text-center">
                                                        <p className="text-slate-400 text-sm font-medium">No team members invited yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 8 && (
                                    <div className="animate-in fade-in zoom-in duration-500 max-w-lg mx-auto py-12">
                                        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-10">
                                            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                                                <CheckCircle2 size={40} strokeWidth={2.5} />
                                            </div>
                                            <div className="space-y-2">
                                                <h2 className="text-2xl font-bold tracking-tight text-slate-900">You're all set!</h2>
                                                <p className="text-slate-500 text-sm font-medium">Everything is ready for your team to start working.</p>
                                            </div>
                                            <div className="divide-y divide-slate-100 border-t border-b border-slate-100 py-4">
                                                <ValidationSummary label="Business Profile" status={orgData.name.length > 2} />
                                                <ValidationSummary label="App Connections" status={connectivity.email.active || connectivity.sms.active} />
                                                <ValidationSummary label="Services" status={services.length > 0} />
                                            </div>
                                            <button
                                                onClick={handleNext}
                                                disabled={isPending}
                                                className="w-full bg-slate-900 text-white h-14 rounded-xl text-base font-bold hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center"
                                            >
                                                {isPending ? <Loader2 className="animate-spin" /> : "Go to Dashboard"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {error && (
                                        <div className="text-sm font-bold text-red-600 bg-red-50 p-6 rounded-2xl border border-red-100 flex items-start gap-4 animate-in slide-in-from-bottom-4">
                                            <AlertCircle size={20} className="shrink-0" />
                                            <div className="space-y-3">
                                                <p className="tracking-tight">{error}</p>
                                                {error.includes("already active") && (
                                                    <button
                                                        onClick={() => router.push("/login")}
                                                        className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-200 transition-all w-fit"
                                                    >
                                                        Take me to Login
                                                    </button>
                                                )}
                                                <p className="text-[11px] opacity-70 font-medium lowercase">Please fix the issues above to continue.</p>
                                            </div>
                                        </div>
                                    )}
                                    {successMsg && (
                                        <div className="text-sm font-bold text-emerald-600 bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-start gap-4 animate-in slide-in-from-bottom-4">
                                            <CheckCircle2 size={20} className="shrink-0" />
                                            <div className="space-y-1">
                                                <p className="tracking-tight">{successMsg}</p>
                                                <p className="text-[11px] opacity-70 font-medium lowercase">Settings saved successfully.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Simple Bottom Navigation - Anchored to Viewport Footer */}
                    {currentStep < 8 && (
                        <div className="h-20 border-t border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-10 gap-2 shrink-0">
                            <button
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                disabled={currentStep === 1 || isPending}
                                className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-900 disabled:opacity-0 transition-all flex items-center gap-2"
                            >
                                <ArrowLeft size={16} /> Back
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={isPending}
                                className="bg-slate-900 text-white h-11 px-10 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center min-w-[160px]"
                            >
                                {isPending ? <Loader2 size={18} className="animate-spin" /> : "Continue"}
                            </button>
                        </div>
                    )}
                </main>
            </div >

            <style jsx global>{`
                .input-base {
                    width: 100%;
                    height: 48px;
                    border-radius: 10px;
                    border: 1px solid #E2E8F0;
                    padding: 0 16px;
                    font-size: 15px;
                    font-weight: 600;
                    color: #0F172A;
                    outline: none;
                    transition: all 0.15s ease-in-out;
                    background: #FFFFFF;
                }
                .input-base:focus {
                    border-color: #0F172A;
                    box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.03);
                }
                .input-base::placeholder {
                    color: #94A3B8;
                    font-weight: 500;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div >
    );
}

function InputBlock({ label, value, onChange, placeholder, type = "text" }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-0.5">{label}</label>
            <input
                className="input-base"
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}

function ChannelBox({ title, isActive, children }) {
    return (
        <div className="p-8 border border-slate-100 rounded-2xl bg-white space-y-4">
            <div className="flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-slate-200")} />
                <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-900">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function ToggleBtn({ active, onClick, label }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-1 py-3 px-4 rounded-lg border text-sm font-bold transition-all flex items-center justify-between",
                active ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-500"
            )}
        >
            <span className="text-[13px] tracking-tight">{label}</span>
            {active && <Check size={14} strokeWidth={3} />}
        </button>
    );
}

function ValidationSummary({ label, status }) {
    return (
        <div className="flex justify-between items-center py-4 px-2">
            <span className="text-sm font-medium text-slate-600">{label}</span>
            {status ? (
                <Check className="text-emerald-500" size={18} strokeWidth={3} />
            ) : (
                <div className="w-4 h-4 rounded-full bg-slate-100" />
            )}
        </div>
    );
}
