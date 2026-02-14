"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Settings,
    Globe,
    Mail,
    Smartphone,
    Shield,
    Save,
    Loader2,
    Eye,
    EyeOff,
    CheckCircle2,
    ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getWorkspaceSettings, updateOrganization } from "./settings-actions";

const TIME_ZONES = [
    { label: "(GMT+05:30) Mumbai, Kolkata", value: "Asia/Kolkata" },
    { label: "(GMT+00:00) UTC", value: "UTC" },
    { label: "(GMT-05:00) New York, Toronto", value: "America/New_York" },
    { label: "(GMT-08:00) Los Angeles, Vancouver", value: "America/Los_Angeles" },
];

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const [workspace, setWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [showKey, setShowKey] = useState({});

    useEffect(() => {
        if (session?.user?.role === 'OWNER') {
            loadSettings();
        }
    }, [session]);

    async function loadSettings() {
        const data = await getWorkspaceSettings();
        setWorkspace(data);
        setLoading(false);
    }

    const handleOrgUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.target);
        await updateOrganization({
            name: formData.get("name"),
            address: formData.get("address"),
            timezone: formData.get("timezone")
        });
        setIsSaving(false);
    };

    if (status === "loading" || (loading && session?.user?.role === 'OWNER')) return (
        <div className="h-full flex items-center justify-center py-20 bg-white">
            <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
    );

    if (session?.user?.role !== 'OWNER') return (
        <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center p-8 bg-white space-y-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest">Access Restricted</h2>
            <p className="text-sm text-slate-500 max-w-sm text-center">Organization settings are restricted to administrators. Please contact your workspace owner for changes.</p>
        </div>
    );

    return (
        <div className="p-8 lg:p-12 space-y-10">
            <div className="max-w-4xl mx-auto space-y-10">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
                    <p className="text-sm text-slate-500">Configure your organization and workspace parameters.</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg w-fit border border-slate-200">
                    <TabButton label="General" id="general" active={activeTab === 'general'} onClick={setActiveTab} icon={Globe} />
                    <TabButton label="Integrations" id="channels" active={activeTab === 'channels'} onClick={setActiveTab} icon={Mail} />
                    <TabButton label="Security" id="security" active={activeTab === 'security'} onClick={setActiveTab} icon={Shield} />
                </div>

                <div className="space-y-6">
                    {activeTab === 'general' && (
                        <form onSubmit={handleOrgUpdate} className="space-y-6">
                            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">Organization Profile</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinic Name</label>
                                        <input name="name" defaultValue={workspace.name} className="w-full h-11 border border-slate-200 rounded-lg px-4 text-sm font-medium outline-none focus:border-slate-900 transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timezone</label>
                                        <select
                                            name="timezone"
                                            defaultValue={workspace.timezone}
                                            className="w-full h-11 border border-slate-200 rounded-lg px-4 text-sm font-medium outline-none focus:border-slate-900 transition-all bg-white"
                                        >
                                            {TIME_ZONES.map(tz => (
                                                <option key={tz.value} value={tz.value}>{tz.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</label>
                                        <textarea name="address" defaultValue={workspace.address} className="w-full min-h-[100px] border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-slate-900 transition-all resize-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button disabled={isSaving} className="h-11 px-6 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Save Changes</>}
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'channels' && (
                        <div className="space-y-6">
                            {workspace.channels.map((ch) => (
                                <div key={ch.id} className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
                                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                {ch.type === 'EMAIL' ? <Mail size={18} /> : <Smartphone size={18} />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">{ch.type} Integration</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ch.provider}</p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
                                            ch.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                        )}>
                                            {ch.isActive ? "Connected" : "Inactive"}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {Object.entries(ch.config).map(([key, val]) => (
                                            <div key={key} className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{key.replace('_', ' ')}</label>
                                                <div className="relative">
                                                    <input
                                                        type={showKey[`${ch.id}-${key}`] ? "text" : "password"}
                                                        defaultValue={val}
                                                        readOnly
                                                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-4 pr-12 text-xs font-medium outline-none text-slate-500"
                                                    />
                                                    <button
                                                        onClick={() => setShowKey(prev => ({ ...prev, [`${ch.id}-${key}`]: !prev[`${ch.id}-${key}`] }))}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors"
                                                    >
                                                        {showKey[`${ch.id}-${key}`] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">Security Overview</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                                    <Shield className="text-teal-500" size={24} />
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Enterprise Encryption</p>
                                        <p className="text-xs text-slate-500">Workspace data is protected with AES-256 standard encryption at rest.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                                    <CheckCircle2 className="text-teal-500" size={24} />
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Access Auditing</p>
                                        <p className="text-xs text-slate-500">Every administration action is logged for security compliance.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TabButton({ label, id, active, onClick, icon: Icon }) {
    return (
        <button
            onClick={() => onClick(id)}
            className={cn(
                "px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all",
                active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            )}
        >
            <Icon size={14} /> {label}
        </button>
    )
}
