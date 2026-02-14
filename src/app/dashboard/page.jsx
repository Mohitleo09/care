"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Calendar,
    MessageSquare,
    FileText,
    Activity,
    Package,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDashboardOverview } from "./dashboard-actions";

export default function DashboardPage() {
    const { data: session } = useSession();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const result = await getDashboardOverview();
            setData(result);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const [sendingReminder, setSendingReminder] = useState(null);

    async function handleSendReminder(id, name) {
        setSendingReminder(id);
        try {
            const { sendFormReminder } = await import('./dashboard-actions');
            const result = await sendFormReminder(id);
            if (result.error) {
                alert(result.error);
            } else {
                alert(`Reminder sent to ${name}`);
                loadData();
            }
        } catch (err) {
            console.error(err);
            alert("Failed to send reminder");
        } finally {
            setSendingReminder(null);
        }
    }

    if (loading) return (
        <div className="h-full flex items-center justify-center py-20 bg-white border-t border-slate-100">
            <Loader2 className="animate-spin text-slate-300" size={32} />
        </div>
    );

    if (!data) return (
        <div className="h-full flex flex-col items-center justify-center py-20 bg-white border-t border-slate-100">
            <Activity className="text-rose-500 mb-4" size={48} />
            <h2 className="text-lg font-bold text-slate-900">Data Unavailable</h2>
            <p className="text-sm text-slate-500 mb-6">Unable to load dashboard metrics at this time.</p>
            <button
                onClick={loadData}
                className="px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all uppercase tracking-widest"
            >
                Retry Connection
            </button>
        </div>
    );

    return (
        <div className="p-8 lg:p-12 space-y-10 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-8">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Practice vitals and operational status.</p>
                </div>
            </div>

            {/* KEY METRICS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {data.stats.map((stat, i) => {
                    const Icon = stat.icon === "Calendar" ? Calendar : stat.icon === "MessageSquare" ? MessageSquare : stat.icon === "FileText" ? FileText : Activity;
                    return (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("p-1.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-100")}>
                                    <Icon size={14} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tighter">{stat.value}</h3>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{stat.trend}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* PRIMARY ACTIONS & ALERTS */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest tracking-[0.1em]">Active Alerts ({data.alerts.length})</h2>
                    </div>

                    <div className="space-y-4">
                        {data.alerts.length > 0 ? (
                            data.alerts.slice(0, 5).map((alert) => (
                                <div key={alert.id} className="group bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-6 hover:border-slate-300 transition-all">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                                        alert.priority === 'critical' ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-slate-50 border-slate-100 text-slate-400"
                                    )}>
                                        {alert.type === 'inventory' ? <Package size={18} /> : alert.type === 'message' ? <MessageSquare size={18} /> : <FileText size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="font-bold text-sm text-slate-900 tracking-tight">{alert.title}</h4>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{alert.time}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium truncate tracking-tight">{alert.desc}</p>
                                    </div>
                                    {alert.type === 'compliance' && alert.formInstanceId && (
                                        <button
                                            onClick={() => handleSendReminder(alert.formInstanceId, alert.contactName)}
                                            disabled={sendingReminder === alert.formInstanceId}
                                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest border-l border-slate-100 pl-6 flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {sendingReminder === alert.formInstanceId && <Loader2 className="animate-spin" size={10} />}
                                            {sendingReminder === alert.formInstanceId ? "Sending..." : "Send Reminder"}
                                        </button>
                                    )}
                                    {alert.type === 'inventory' && (
                                        <a href="/dashboard/inventory" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest border-l border-slate-100 pl-6">
                                            Manage →
                                        </a>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30">
                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Workspace environment optimal</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* SYSTEM FEED */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4">Operational Status</h3>
                        <div className="space-y-5">
                            <StatusItem label="Confirmed Today" value={data.sections.bookings.today} />
                            <StatusItem label="Upcoming Queue" value={data.sections.bookings.upcoming} />
                            <StatusItem label="Resource Hazards" value={data.sections.inventory.critical} color={data.sections.inventory.critical > 0 ? "text-rose-500" : "text-slate-900"} />
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-8 text-white space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold tracking-tight">Booking Gateway</h3>
                            <p className="text-slate-400 text-[11px] font-medium leading-relaxed">Copy the link below to share with patients.</p>
                        </div>
                        <div className="bg-white/10 p-3 rounded-xl border border-white/5 text-[10px] font-mono text-slate-300 truncate mb-4">
                            {typeof window !== 'undefined' ? `${window.location.host}/workspace/${data.workspace?.slug}/book` : 'loading...'}
                        </div>
                        <button
                            onClick={() => {
                                const link = `${window.location.origin}/workspace/${data.workspace?.slug}/book`;
                                navigator.clipboard.writeText(link);
                                alert('Public booking link copied to clipboard.');
                            }}
                            className="w-full py-3 bg-white text-slate-900 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest"
                        >
                            Copy Public Link
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusItem({ label, value, color = "text-slate-900" }) {
    return (
        <div className="flex justify-between items-center group">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight group-hover:text-slate-500 transition-colors">{label}</span>
            <span className={cn("text-xs font-black tracking-tighter", color)}>{value}</span>
        </div>
    );
}
