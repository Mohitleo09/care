"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    Users,
    DollarSign,
    Activity,
    Loader2,
    BarChart3,
    ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAnalytics } from "./analytics-actions";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";

const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
    const { data: session, status } = useSession();
    const [timeRange, setTimeRange] = useState("7d");
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.role === 'OWNER') {
            loadAnalytics();
        } else if (status !== "loading") {
            setLoading(false);
        }
    }, [timeRange, session, status]);

    async function loadAnalytics() {
        setLoading(true);
        try {
            const data = await getAnalytics(timeRange);
            setAnalytics(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    if (status === "loading" || (loading && !analytics)) return (
        <div className="h-full flex items-center justify-center py-20 bg-white">
            <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
    );

    if (session?.user?.role !== 'OWNER') return (
        <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center p-8 bg-white space-y-4">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest">Access Restricted</h2>
            <p className="text-sm text-slate-500 max-w-sm text-center">Owner visibility required for financial and operational metrics.</p>
        </div>
    );

    return (
        <div className="p-8 lg:p-12 space-y-12 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h1>
                    <p className="text-sm text-slate-500">Workspace performance and metrics.</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    {[
                        { label: "7D", value: "7d" },
                        { label: "30D", value: "30d" },
                        { label: "90D", value: "90d" }
                    ].map((range) => (
                        <button
                            key={range.value}
                            onClick={() => setTimeRange(range.value)}
                            className={cn(
                                "px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all",
                                timeRange === range.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Simple Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    label="Revenue"
                    value={`$${analytics?.revenue?.total?.toLocaleString() || 0}`}
                    change={analytics?.revenue?.change}
                    icon={DollarSign}
                    positive={analytics?.revenue?.change > 0}
                />
                <KPICard
                    label="Patients"
                    value={analytics?.customers?.new?.toString() || "0"}
                    change={analytics?.customers?.change}
                    icon={Users}
                    positive={analytics?.customers?.change >= 0}
                />
                <KPICard
                    label="Bookings"
                    value={analytics?.bookings?.total?.toString() || "0"}
                    change={analytics?.bookings?.change}
                    icon={Calendar}
                    positive={analytics?.bookings?.change >= 0}
                />
                <KPICard
                    label="Completion"
                    value={`${analytics?.completionRate || 0}%`}
                    change={analytics?.completionRateChange}
                    icon={Activity}
                    positive={analytics?.completionRateChange >= 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Revenue Trend</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={analytics?.revenueTrend || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="date" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} dy={10} />
                            <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} dx={-5} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                            />
                            <Line type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Popular Services */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Top Services</h3>
                    <div className="space-y-6">
                        {(analytics?.topServices || []).map((service, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-slate-900">{service.name}</p>
                                    <span className="text-xs font-bold text-slate-400">{service.count}</span>
                                </div>
                                <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                    <div
                                        className="h-full bg-slate-900 rounded-full"
                                        style={{ width: `${analytics?.topServices?.[0]?.count ? (service.count / analytics.topServices[0].count) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {(!analytics?.topServices || analytics.topServices.length === 0) && (
                            <p className="text-xs text-slate-400 italic">No bookings recorded for this period.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ label, value, change, icon: Icon, positive }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-400">
                    <Icon size={16} />
                </div>
            </div>
            <div>
                <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
                <div className={cn(
                    "flex items-center gap-1.5 mt-2 text-[10px] font-bold uppercase tracking-widest",
                    positive ? "text-teal-600" : "text-rose-600"
                )}>
                    {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(change)}%
                </div>
            </div>
        </div>
    );
}
