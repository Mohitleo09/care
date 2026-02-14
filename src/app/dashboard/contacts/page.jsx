"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Search,
    Plus,
    Mail,
    Phone,
    Calendar,
    Loader2,
    MessageSquare,
    CheckCircle2,
    Clock,
    TrendingUp,
    X,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getContacts, createContact } from "./contacts-actions";

export default function ContactsPage() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("all");
    const [showNewContactModal, setShowNewContactModal] = useState(false);

    useEffect(() => {
        loadContacts();
    }, []);

    async function loadContacts() {
        try {
            const data = await getContacts();
            setContacts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = searchTerm === "" ||
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.phone?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filter === "all" ||
            (filter === "active" && contact.bookings.length > 0) ||
            (filter === "pending" && contact.bookings.some(b => b.status === "PENDING"));

        return matchesSearch && matchesFilter;
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
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Client Directory</h1>
                        <p className="text-sm text-slate-500">Manage your patient database and interaction history.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search patients..."
                                className="w-64 h-10 bg-white border border-slate-200 rounded-lg pl-9 pr-4 text-xs font-medium focus:border-slate-900 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setShowNewContactModal(true)}
                            className="h-10 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                        >
                            <Plus size={14} /> Add Patient
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Total Patients" value={contacts.length.toString()} icon={Users} />
                    <StatCard label="Active" value={contacts.filter(c => c.bookings.length > 0).length.toString()} icon={CheckCircle2} color="text-teal-500" />
                    <StatCard label="Pending" value={contacts.filter(c => c.bookings.some(b => b.status === "PENDING")).length.toString()} icon={Clock} color="text-amber-500" />
                    <StatCard label="New This Week" value={contacts.filter(c => new Date(c.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length.toString()} icon={TrendingUp} color="text-blue-500" />
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Name</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Info</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">History</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredContacts.map((contact) => (
                                    <tr key={contact.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-[10px]">
                                                    {contact.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="font-bold text-slate-900">{contact.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-600 text-xs font-medium space-y-0.5">
                                                <div className="flex items-center gap-1.5"><Mail size={12} className="text-slate-300" /> {contact.email}</div>
                                                {contact.phone && <div className="flex items-center gap-1.5"><Phone size={12} className="text-slate-300" /> {contact.phone}</div>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={12} /> {contact.bookings.length} Orders
                                                </div>
                                                {contact.bookings[0] && (
                                                    <div className="text-slate-300">Last: {new Date(contact.bookings[0].dateTime).toLocaleDateString()}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={`/dashboard/inbox?contact=${contact.id}`}
                                                    className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                                                    title="Send Message"
                                                >
                                                    <MessageSquare size={16} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredContacts.length === 0 && (
                        <div className="text-center py-20 bg-white">
                            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No clients matching criteria</p>
                        </div>
                    )}
                </div>
            </div>

            {showNewContactModal && (
                <NewContactModal
                    onClose={() => setShowNewContactModal(false)}
                    onSuccess={() => {
                        setShowNewContactModal(false);
                        loadContacts();
                    }}
                />
            )}
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color = "text-slate-400" }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between transition-all hover:border-slate-300">
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

function NewContactModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await createContact(formData);
            onSuccess();
        } catch (err) {
            setError(err.message || "Failed to add client");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <header className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">Add New Patient</h3>
                    <button onClick={onClose} className="p-1 text-slate-300 hover:text-slate-900 transition-colors">
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 text-rose-600">
                            <AlertCircle size={16} />
                            <p className="text-xs font-bold">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm font-medium focus:border-slate-900 outline-none transition-all"
                                placeholder="Patient full name"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm font-medium focus:border-slate-900 outline-none transition-all"
                                placeholder="patient@example.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm font-medium focus:border-slate-900 outline-none transition-all"
                                placeholder="Mobile or landline"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin text-white" size={18} /> : "Save New Patient"}
                    </button>
                </form>
            </div>
        </div>
    );
}
