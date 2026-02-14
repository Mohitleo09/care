"use client";

import { useState, useEffect } from "react";
import {
    Shield,
    User,
    Clock,
    Search,
    Download,
    Calendar,
    CheckCircle2,
    FileText,
    Settings,
    MessageSquare,
    Loader2,
    ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuditLogs } from "./audit-actions";

export default function AuditLogPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadLogs();
    }, []);

    async function loadLogs() {
        try {
            const data = await getAuditLogs();
            setLogs(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filteredLogs = logs.filter(log => {
        const matchesFilter = filter === "all" || log.action.toLowerCase().includes(filter.toLowerCase());
        const matchesSearch = searchTerm === "" ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.entity.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) return (
        <div className="h-full flex items-center justify-center py-20 bg-white">
            <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
    );

    return (
        <div className="p-8 lg:p-12 space-y-10">
            <div className="max-w-6xl mx-auto space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Trail</h1>
                        <p className="text-sm text-slate-500">Workspace activity and interaction history.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search activity..."
                                className="w-64 h-10 bg-white border border-slate-200 rounded-lg pl-9 pr-4 text-xs font-medium focus:border-slate-900 outline-none transition-all"
                            />
                        </div>
                        <button className="h-10 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:border-slate-900 hover:text-slate-900 transition-all flex items-center gap-2">
                            <Download size={14} /> Export
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Total Events" value={logs.length} icon={Shield} />
                    <StatCard label="User Actions" value={logs.filter(l => l.action.includes("USER")).length} icon={User} color="text-teal-500" />
                    <StatCard label="Operations" value={logs.filter(l => l.action.includes("BOOKING") || l.action.includes("MESSAGE")).length} icon={CheckCircle2} color="text-blue-500" />
                    <StatCard label="Today" value={logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length} icon={Clock} color="text-amber-500" />
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entity</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actor</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLogs.map((log) => (
                                    <AuditRow key={log.id} log={log} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AuditRow({ log }) {
    const [expanded, setExpanded] = useState(false);

    const getActionIcon = (action) => {
        if (action.includes("USER")) return User;
        if (action.includes("MESSAGE")) return MessageSquare;
        if (action.includes("BOOKING")) return Calendar;
        if (action.includes("SETTINGS")) return Settings;
        return FileText;
    };

    const Icon = getActionIcon(log.action);

    return (
        <>
            <tr className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                            <Icon size={14} />
                        </div>
                        <span className="font-bold text-slate-900 text-xs uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-widest">{log.entity}</span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                    {log.userId?.substring(0, 8) || "SYSTEM"}
                </td>
                <td className="px-6 py-4 text-xs text-slate-400 tabular-nums">
                    {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-6 py-4 text-right">
                    <ChevronDown size={14} className={cn("inline transition-transform text-slate-300", expanded && "rotate-180 text-slate-900")} />
                </td>
            </tr>
            {expanded && (
                <tr className="bg-slate-50/50">
                    <td colSpan={5} className="px-6 py-4">
                        <div className="p-4 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-500 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

function StatCard({ label, value, icon: Icon, color = "text-slate-400" }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
            </div>
            <div className={cn("p-2 rounded-lg bg-slate-50 border border-slate-100", color)}>
                <Icon size={18} />
            </div>
        </div>
    );
}
