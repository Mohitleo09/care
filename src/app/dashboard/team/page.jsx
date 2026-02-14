"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Users,
    Plus,
    ShieldCheck,
    Mail,
    UserPlus,
    Activity,
    Loader2,
    X,
    AlertCircle,
    ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTeam, inviteUser, removeMember, resendInvitation } from "../dashboard-actions";

export default function TeamManagementPage() {
    const { data: session, status } = useSession();
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (session?.user?.role === 'OWNER') {
            loadTeam();
        }
    }, [session]);

    async function loadTeam() {
        try {
            const data = await getTeam();
            setTeam(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleInvite(e) {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.target);
        try {
            const result = await inviteUser(formData);
            if (result.error) {
                alert(result.error);
            } else {
                alert("Invitation sent! The team member will receive an email to set up their password.");
                setIsInviting(false);
                e.target.reset();
                loadTeam();
            }
        } catch (err) {
            console.error(err);
            alert("Failed to send invitation: " + err.message);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleResendInvite(member) {
        try {
            const result = await resendInvitation(member.id);
            if (result.error) {
                alert(result.error);
            } else {
                alert(`Invitation email has been sent to ${member.email}`);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to resend invitation");
        }
    }

    async function handleDeleteMember(member) {
        if (!confirm(`Are you sure you want to delete ${member.name} from your team? This action cannot be undone.`)) {
            return;
        }
        try {
            const result = await removeMember(member.id);
            if (result.error) {
                alert(result.error);
            } else {
                alert(`${member.name} has been removed from your team`);
                loadTeam();
            }
        } catch (err) {
            console.error(err);
            alert("Failed to remove team member");
        }
    }

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
            <p className="text-sm text-slate-500 max-w-sm text-center">Team management is restricted to organization owners. Please contact your administrator for staff changes.</p>
        </div>
    );

    const owners = team.filter(u => u.role === 'OWNER').length;
    const staff = team.filter(u => u.role === 'STAFF').length;

    return (
        <div className="p-8 lg:p-12 space-y-10">
            <div className="max-w-6xl mx-auto space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Management</h1>
                        <p className="text-sm text-slate-500">Manage professional roles and clinic workspace access.</p>
                    </div>
                    <button
                        onClick={() => setIsInviting(true)}
                        className="h-10 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <UserPlus size={14} /> Add Member
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <RoleStat label="Admins" count={owners} icon={ShieldCheck} />
                    <RoleStat label="Staff" count={staff} icon={Users} />
                    <RoleStat label="Active" count={team.length} icon={Activity} />
                    <RoleStat label="Recent" count={team.length} icon={Activity} />
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Member</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {team.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-[10px]">
                                                    {member.name ? member.name.split(' ').map(n => n[0]).join('') : "M"}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{member.name || "Invite Pending"}</div>
                                                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                        <Mail size={10} /> {member.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
                                                member.role === 'OWNER' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                                            )}>
                                                {member.role === 'OWNER' ? "Admin" : "Staff"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    {member.password ? "Active" : "Pending"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {!member.password && (
                                                    <button
                                                        onClick={() => handleResendInvite(member)}
                                                        className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        Resend Invite
                                                    </button>
                                                )}
                                                {member.role !== 'OWNER' && (
                                                    <button
                                                        onClick={() => handleDeleteMember(member)}
                                                        className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isInviting && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <header className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">Invite Team Member</h3>
                            <button onClick={() => setIsInviting(false)} className="p-1 text-slate-300 hover:text-slate-900 transition-colors">
                                <X size={20} />
                            </button>
                        </header>
                        <form onSubmit={handleInvite} className="p-6 space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                                    <input name="name" required className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm font-medium focus:border-slate-900 outline-none transition-all" placeholder="Member name" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                                    <input name="email" type="email" required className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm font-medium focus:border-slate-900 outline-none transition-all" placeholder="email@clinic.com" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</label>
                                    <select name="role" className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm font-medium focus:border-slate-900 outline-none transition-all bg-white">
                                        <option value="STAFF">Staff Member</option>
                                        <option value="OWNER">Administrator</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full h-12 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {isSaving ? <Loader2 className="animate-spin text-white" size={18} /> : "Add Member"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


function RoleStat({ label, count, icon: Icon }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <Icon size={18} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{count}</p>
            </div>
        </div>
    );
}
