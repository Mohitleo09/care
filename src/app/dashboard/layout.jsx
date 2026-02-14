"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
    BarChart3,
    Calendar,
    MessageSquare,
    User,
    Users,
    Settings as SettingsIcon,
    Bell,
    Plus,
    Layout,
    LogOut,
    Loader2,
    AlertTriangle,
    Search,
    Package,
    FileText,
    UserPlus,
    CalendarPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDashboardOverview } from "./dashboard-actions";

export default function DashboardLayout({ children }) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        if (session) {
            loadNotifications();
        }
    }, [session]);

    async function loadNotifications() {
        try {
            const data = await getDashboardOverview();
            setNotifications(data.alerts || []);
            setNotificationCount(data.alerts?.length || 0);
        } catch (err) {
            console.error(err);
        }
    }

    if (status === "loading") return (
        <div className="h-screen bg-white flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-slate-400" size={32} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Getting your dashboard ready...</p>
        </div>
    );

    if (!session) return (
        <div className="h-screen bg-white flex flex-col items-center justify-center space-y-4">
            <AlertTriangle className="text-rose-500" size={32} />
            <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Access Denied</p>
            <button onClick={() => window.location.href = "/login"} className="text-sm font-bold border-b-2 border-slate-900 pb-1 mt-4">Return to Login</button>
        </div>
    );

    const isOwner = session.user.role === 'OWNER';

    const NAV_ITEMS = [
        { label: "Overview", icon: BarChart3, href: "/dashboard", group: "Management" },
        { label: "Inbox", icon: MessageSquare, href: "/dashboard/inbox", group: "Management" },
        { label: "Bookings", icon: Calendar, href: "/dashboard/bookings", group: "Management" },
        { label: "Inventory", icon: Package, href: "/dashboard/inventory", group: "Management" },
        { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics", group: "Management", roles: ['OWNER'] },
        { label: "Patients", icon: User, href: "/dashboard/contacts", group: "System" },
        { label: "Team", icon: Users, href: "/dashboard/team", group: "System", roles: ['OWNER'] },
        { label: "Settings", icon: SettingsIcon, href: "/dashboard/settings", group: "System", roles: ['OWNER'] },
    ];

    const filteredNav = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(session.user.role));

    const quickActions = [
        { label: "New Booking", icon: CalendarPlus, action: () => router.push('/dashboard/bookings') },
        { label: "Add Patient", icon: UserPlus, action: () => router.push('/dashboard/contacts') },
        ...(isOwner ? [{ label: "Invite Team Member", icon: Users, action: () => router.push('/dashboard/team') }] : [])
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
            {/* NAVIGATION SIDEBAR */}
            <aside className="w-64 flex flex-col bg-white border-r border-slate-200 shrink-0 h-full">
                <div className="h-20 px-8 flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-950 rounded flex items-center justify-center">
                        <Layout className="text-white" size={16} />
                    </div>
                    <span className="text-sm font-bold tracking-tight text-slate-900 uppercase tracking-widest">CareOps</span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {['Management', 'System'].map(group => {
                        const items = filteredNav.filter(item => item.group === group);
                        if (items.length === 0) return null;
                        return (
                            <div key={group} className="space-y-1">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 mt-4 first:mt-2">{group}</div>
                                {items.map(item => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                            pathname === item.href
                                                ? "bg-slate-100 text-slate-900 font-semibold"
                                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        <item.icon size={16} />
                                        {item.label}
                                        {item.badge && (
                                            <span className="ml-auto bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.badge}</span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-transparent">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0 lowercase">
                            {session.user.name ? session.user.name.substring(0, 1) : "a"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{session.user.name}</p>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest lowercase">{session.user.role}</p>
                        </div>
                        <button onClick={() => signOut({ callbackUrl: "/" })} className="text-slate-300 hover:text-rose-500 transition-colors">
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input
                            type="text"
                            placeholder="Quick search..."
                            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 text-xs font-medium focus:bg-white focus:border-slate-900 outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        {/* NOTIFICATIONS DROPDOWN */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowNotifications(!showNotifications);
                                    setShowActions(false);
                                }}
                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 relative rounded-lg hover:bg-slate-50 transition-all"
                            >
                                <Bell size={18} />
                                {notificationCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                                )}
                            </button>

                            {showNotifications && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowNotifications(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-[500px] overflow-hidden flex flex-col">
                                        <div className="p-4 border-b border-slate-100">
                                            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{notificationCount} important alerts</p>
                                        </div>
                                        <div className="overflow-y-auto flex-1">
                                            {notifications.length > 0 ? (
                                                notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={cn(
                                                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                                                notification.priority === 'critical' ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"
                                                            )}>
                                                                {notification.type === 'inventory' ? <Package size={14} /> : <FileText size={14} />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="text-xs font-bold text-slate-900 truncate">{notification.title}</h4>
                                                                    {notification.priority === 'critical' && (
                                                                        <span className="bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Priority</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[11px] text-slate-500 leading-relaxed">{notification.desc}</p>
                                                                {notification.type === 'compliance' && (
                                                                    <p className="text-[10px] text-blue-500 font-bold mt-1">Pending Submission</p>
                                                                )}
                                                                <p className="text-[9px] text-slate-300 mt-1 uppercase tracking-widest">{notification.time}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center">
                                                    <Bell className="mx-auto text-slate-200 mb-3" size={32} />
                                                    <p className="text-xs font-bold text-slate-400">No notifications</p>
                                                    <p className="text-[10px] text-slate-300 mt-1">You're all caught up!</p>
                                                </div>
                                            )}
                                        </div>
                                        {notifications.length > 0 && (
                                            <div className="p-3 border-t border-slate-100">
                                                <Link
                                                    href="/dashboard"
                                                    onClick={() => setShowNotifications(false)}
                                                    className="block text-center text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                                                >
                                                    View All Alerts
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* QUICK ACTIONS DROPDOWN */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowActions(!showActions);
                                    setShowNotifications(false);
                                }}
                                className="h-10 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                            >
                                <Plus size={14} /> Quick Action
                            </button>

                            {showActions && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowActions(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1">
                                        {quickActions.map((action, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    action.action();
                                                    setShowActions(false);
                                                }}
                                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
                                            >
                                                <action.icon size={16} className="text-slate-400" />
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header >

                <main className="flex-1 overflow-y-auto bg-slate-50/50 relative">
                    {children}
                </main>
            </div >
        </div >
    );
}
