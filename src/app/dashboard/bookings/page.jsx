"use client";

import { useState, useEffect } from "react";
import { getBookings, updateBookingStatus, getFormSubmission } from "../dashboard-actions";
import { cn } from "@/lib/utils";
import {
    Calendar,
    MoreVertical,
    Clock,
    MapPin,
    Loader2,
    AlertCircle,
    Eye,
    X
} from "lucide-react";

export default function BookingsManagementPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [loadingSubmission, setLoadingSubmission] = useState(false);

    useEffect(() => {
        loadBookings();
    }, []);

    async function loadBookings() {
        try {
            const data = await getBookings();
            setBookings(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusUpdate(id, status) {
        setUpdating(id);
        try {
            await updateBookingStatus({ bookingId: id, status });
            await loadBookings();
        } catch (err) {
            console.error(err);
        } finally {
            setUpdating(null);
        }
    }

    async function handleViewForm(formInstanceId) {
        setLoadingSubmission(true);
        try {
            const submission = await getFormSubmission(formInstanceId);
            setSelectedSubmission(submission);
        } catch (err) {
            alert("Failed to load form submission");
        } finally {
            setLoadingSubmission(false);
        }
    }

    if (loading) return (
        <div className="h-full bg-white flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-slate-400" size={32} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Loading Schedule...</p>
        </div>
    );

    const stats = {
        confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
        pending: bookings.filter(b => b.status === 'PENDING').length,
        completed: bookings.filter(b => b.status === 'COMPLETED').length,
        noshow: bookings.filter(b => b.status === 'NOSHOW').length
    };

    return (
        <div className="p-8 lg:p-12 space-y-10 relative">
            <div className="max-w-6xl mx-auto space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments</h1>
                        <p className="text-sm text-slate-500">Manage your upcoming services and patient appointments.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <BookingStat label="Confirmed" value={stats.confirmed} color="text-slate-900" />
                    <BookingStat label="Pending" value={stats.pending} color="text-amber-600" />
                    <BookingStat label="Completed" value={stats.completed} color="text-emerald-600" />
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date & Time</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compliance</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {bookings.map((booking) => {
                                    const totalForms = booking.forms?.length || 0;
                                    const completedForms = booking.forms?.filter(f => f.status === 'COMPLETED') || [];
                                    const isSubmitting = updating === booking.id;

                                    return (
                                        <tr key={booking.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{booking.contact.name}</div>
                                                <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{booking.contact.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">
                                                {booking.serviceType.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Clock size={14} className="text-slate-300" />
                                                    <span className="font-medium">{new Date(booking.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {totalForms > 0 ? (
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden max-w-[60px]">
                                                                <div
                                                                    className={cn(
                                                                        "h-full transition-all duration-500",
                                                                        completedForms.length === totalForms ? "bg-emerald-500" : "bg-blue-500"
                                                                    )}
                                                                    style={{ width: `${(completedForms.length / totalForms) * 100}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400">{completedForms.length}/{totalForms}</span>
                                                        </div>
                                                        <p className={cn(
                                                            "text-[9px] font-bold uppercase tracking-widest",
                                                            completedForms.length === totalForms ? "text-emerald-500" : "text-blue-500"
                                                        )}>
                                                            {completedForms.length === totalForms ? "Fully Compliant" : "Pending Docs"}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Forms</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
                                                    booking.status === 'CONFIRMED' ? "bg-emerald-50 text-emerald-600" :
                                                        booking.status === 'PENDING' ? "bg-amber-50 text-amber-600" :
                                                            booking.status === 'COMPLETED' ? "bg-slate-100 text-slate-500" :
                                                                "bg-rose-50 text-rose-600"
                                                )}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {completedForms.length > 0 && (
                                                        <div className="flex gap-1 mr-2 border-r border-slate-100 pr-2">
                                                            {completedForms.map(form => (
                                                                <button
                                                                    key={form.id}
                                                                    onClick={() => handleViewForm(form.id)}
                                                                    className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors"
                                                                    title={`View ${form.formTemplate.name}`}
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {booking.status === 'PENDING' && (
                                                        <button
                                                            disabled={isSubmitting}
                                                            onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                                                            className="h-8 px-3 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 disabled:opacity-50"
                                                        >
                                                            Confirm
                                                        </button>
                                                    )}
                                                    {booking.status === 'CONFIRMED' && (
                                                        <>
                                                            <button
                                                                disabled={isSubmitting}
                                                                onClick={() => handleStatusUpdate(booking.id, 'COMPLETED')}
                                                                className="h-8 px-3 bg-teal-600 text-white rounded text-[10px] font-bold hover:bg-teal-700 disabled:opacity-50"
                                                            >
                                                                Complete
                                                            </button>
                                                            <button
                                                                disabled={isSubmitting}
                                                                onClick={() => handleStatusUpdate(booking.id, 'NOSHOW')}
                                                                className="h-8 px-3 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[10px] font-bold hover:bg-rose-100 disabled:opacity-50"
                                                            >
                                                                No-Show
                                                            </button>
                                                        </>
                                                    )}
                                                    {booking.status === 'NOSHOW' && (
                                                        <button
                                                            disabled={isSubmitting}
                                                            onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                                                            className="h-8 px-3 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 disabled:opacity-50"
                                                        >
                                                            Revert to Confirmed
                                                        </button>
                                                    )}
                                                    {(booking.status === 'PENDING' || booking.status === 'CONFIRMED' || booking.status === 'NOSHOW') && (
                                                        <button
                                                            disabled={isSubmitting}
                                                            onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}
                                                            className="h-8 px-3 bg-white border border-slate-200 text-slate-400 rounded text-[10px] font-bold hover:bg-slate-50 disabled:opacity-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {bookings.length === 0 && (
                        <div className="text-center py-20 bg-white">
                            <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
                            <p className="text-sm font-medium text-slate-400">No scheduled appointments found.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* FORM VIEWER MODAL */}
            {(selectedSubmission || loadingSubmission) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        {loadingSubmission ? (
                            <div className="p-20 text-center">
                                <Loader2 className="animate-spin text-slate-400 mx-auto" size={32} />
                                <p className="text-xs text-slate-400 mt-4 font-medium">Fetching Form Data...</p>
                            </div>
                        ) : selectedSubmission ? (
                            <>
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{selectedSubmission.formInstance.formTemplate.name}</h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Submitted by <span className="font-medium text-slate-700">{selectedSubmission.formInstance.booking.contact.name}</span> on {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedSubmission(null)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="p-8 overflow-y-auto space-y-8 bg-white">
                                    {selectedSubmission.formInstance.formTemplate.fields.map((field, idx) => {
                                        const answer = selectedSubmission.data[field.id || `field-${idx}`];
                                        return (
                                            <div key={idx} className="space-y-2">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{field.label}</p>
                                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 text-sm whitespace-pre-wrap">
                                                    {answer || <span className="text-slate-400 italic">No answer provided</span>}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                                    <button
                                        onClick={() => setSelectedSubmission(null)}
                                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50"
                                    >
                                        Close Viewer
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="p-12 text-center">
                                <AlertCircle className="mx-auto text-rose-400 mb-2" size={32} />
                                <p className="text-slate-500">Failed to load submission.</p>
                                <button onClick={() => { setSelectedSubmission(null); setLoadingSubmission(false); }} className="mt-4 text-xs font-bold underline">Close</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function BookingStat({ label, value, color }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
            <p className={cn("text-2xl font-bold tracking-tight", color)}>{value}</p>
        </div>
    )
}
