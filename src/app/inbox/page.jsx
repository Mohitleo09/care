"use client";

import { useState } from "react";
import {
    Search,
    Send,
    Mail,
    MessageSquare,
    Phone,
    MoreVertical,
    Layout,
    Clock,
    CheckCheck,
    Zap,
    Filter,
    Paperclip,
    Smile,
    AlertCircle,
    Archive,
    Star,
    User,
    Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const CONTACTS = [
    { id: 1, name: "Sarah Jenkins", lastMsg: "Confirming the session next week.", time: "2m ago", type: "SMS", unread: true, status: "Priority" },
    { id: 2, name: "Michael Chen", lastMsg: "Intake forms have been uploaded.", time: "15m ago", type: "Email", unread: false },
    { id: 3, name: "Robert Fox", lastMsg: "Inquiry regarding on-site consulting.", time: "2h ago", type: "Email", unread: false, status: "Flagged" },
    { id: 4, name: "Jane Cooper", lastMsg: "Resubmitted the service agreement.", time: "1d ago", type: "SMS", unread: false },
];

const MESSAGES = [
    { id: 1, content: "Hello, I require a tactical consultation for my operating team.", sender: "CUSTOMER", time: "10:00 AM", channel: "SMS" },
    { id: 2, content: "Logic Sequence Start: Automated greeting dispatched to lead.", sender: "AUTO", time: "10:01 AM", channel: "SMS", info: "Inquiry Lead Detection" },
    { id: 3, content: "I see slots available for Tuesday afternoon. Is 02:30 PM possible?", sender: "CUSTOMER", time: "11:15 AM", channel: "SMS" },
    { id: 4, content: "Availability Confirmed. Strategic consultation locked for Dec 12, 02:30 PM.", sender: "STAFF", time: "11:30 AM", channel: "SMS" },
];

export default function InboxPage() {
    const [selectedContact, setSelectedContact] = useState(CONTACTS[0]);
    const [message, setMessage] = useState("");

    return (
        <div className="app-viewport bg-slate-50/50">
            {/* 
         LUXURY SIDEBAR (COLLAPSIBLE / FIXED) 
      */}
            <aside className="w-80 flex flex-col bg-white border-r border-slate-100 shrink-0 h-full z-20">
                <div className="h-20 px-6 flex items-center justify-between border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-md">
                            <Mail className="text-white" size={16} strokeWidth={2.5} />
                        </div>
                        <span className="text-[13px] font-bold tracking-tight text-slate-900 uppercase tracking-widest leading-none">Inbox Terminal</span>
                    </div>
                    <button className="text-slate-400 hover:text-slate-900 transition-colors">
                        <Settings size={16} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Search threads..."
                            className="luxury-input pl-9 text-[13px] font-semibold"
                        />
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Live Streams</span>
                        <Filter size={14} className="text-slate-300 hover:text-slate-900 cursor-pointer transition-colors" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 space-y-1 no-scrollbar pb-4">
                    {CONTACTS.map((contact) => (
                        <div
                            key={contact.id}
                            onClick={() => setSelectedContact(contact)}
                            className={cn(
                                "p-3 rounded-xl cursor-pointer transition-all duration-200 border flex gap-3 group relative overflow-hidden",
                                selectedContact.id === contact.id
                                    ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                                    : "bg-white border-transparent hover:border-slate-100 hover:bg-slate-50 text-slate-600"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border transition-colors",
                                selectedContact.id === contact.id
                                    ? "bg-white/10 border-white/10 text-white"
                                    : "bg-slate-100 border-slate-100 text-slate-500 group-hover:bg-white group-hover:border-slate-200"
                            )}>
                                {contact.name.charAt(0)}
                            </div>
                            <div className="flex-1 overflow-hidden min-w-0 relative z-10">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h4 className={cn("font-bold text-[13px] truncate tracking-tight", selectedContact.id === contact.id ? "text-white" : "text-slate-900")}>{contact.name}</h4>
                                    <span className={cn("text-[10px] font-bold uppercase shrink-0 tabular-nums opacity-60", selectedContact.id === contact.id ? "text-white" : "text-slate-400")}>{contact.time}</span>
                                </div>
                                <p className={cn("text-[12px] truncate font-medium leading-tight opacity-80", selectedContact.id === contact.id ? "text-white" : "text-slate-500", contact.unread && "font-bold opacity-100")}>
                                    {contact.lastMsg}
                                </p>
                            </div>

                            {contact.status && (
                                <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-rose-500 rounded-full ring-4 ring-white/10" />
                            )}
                        </div>
                    ))}
                </div>
            </aside>

            {/* 
         MAIN CHAT VIEWPORT 
      */}
            <div className="flex-1 flex flex-col h-full bg-white relative z-10 min-w-0">

                {/* Header */}
                <header className="h-20 border-b border-slate-100 px-8 flex justify-between items-center bg-white/80 backdrop-blur-md shrink-0 z-30">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                            {selectedContact.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-900 leading-none mb-1 flex items-center gap-2">
                                {selectedContact.name}
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-wider border border-slate-200">
                                    Client
                                </span>
                            </h3>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                <Zap size={10} strokeWidth={3} /> Logic: Active
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
                            <Archive size={16} strokeWidth={2} />
                        </button>
                        <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
                            <Star size={16} strokeWidth={2} />
                        </button>
                        <div className="w-px h-6 bg-slate-100 mx-2" />
                        <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
                            <MoreVertical size={16} strokeWidth={2} />
                        </button>
                    </div>
                </header>

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto px-8 lg:px-12 py-8 space-y-10 bg-slate-50/30 scroll-smooth">
                    <div className="flex items-center gap-4 opacity-50">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Dec 11 • Start of Stream</span>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    {MESSAGES.map((msg) => (
                        <div key={msg.id} className={cn("flex flex-col group animate-luxury-in", msg.sender === 'STAFF' ? "items-end text-right" : "items-start text-left")}>
                            {msg.sender === 'SYSTEM' && (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Bot size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Automation Thread</span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">{msg.info}</p>
                                </div>
                            )}
                            <div className={cn(
                                "max-w-[65%] px-6 py-4 rounded-2xl relative border text-[14px] leading-relaxed shadow-sm transition-all hover:shadow-md",
                                msg.sender === 'STAFF' ? "bg-slate-900 border-slate-900 text-white rounded-tr-sm" :
                                    msg.sender === 'SYSTEM' ? "bg-white/60 border-slate-200 border-dashed text-slate-400 italic rounded-tl-sm backdrop-blur-sm" :
                                        "bg-white border-slate-200 text-slate-700 rounded-tl-sm font-medium"
                            )}>
                                <p>{msg.content}</p>
                            </div>
                            <div className={cn(
                                "flex items-center gap-2 mt-2 px-1 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity",
                                msg.sender === 'STAFF' ? "text-slate-400 flex-row-reverse" : "text-slate-300"
                            )}>
                                <span className="tabular-nums">{msg.time}</span>
                                {msg.sender === 'STAFF' && <CheckCheck size={12} strokeWidth={3} className="text-emerald-500" />}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Terminal */}
                <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                    <div className="max-w-4xl mx-auto space-y-3">
                        <div className="relative group">
                            <textarea
                                rows={1}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={`Reply to ${selectedContact.name}...`}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-5 pr-32 py-4 text-sm font-medium outline-none focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all resize-none shadow-inner"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <div className="flex items-center gap-1 pr-3 border-r border-slate-200">
                                    <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                        <Paperclip size={18} />
                                    </button>
                                    <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                        <Smile size={18} />
                                    </button>
                                </div>
                                <button className="luxury-button-primary h-10 px-4 shadow-lg shadow-slate-900/10 active:scale-95">
                                    <Send size={16} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> All Systems Operational
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
