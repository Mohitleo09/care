"use client";

import { useState, useEffect, useRef } from "react";
import {
    Search,
    Send,
    Bot,
    User,
    MessageSquare,
    Loader2,
    Paperclip
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getConversations, getMessages, sendMessage } from "../dashboard-actions";

export default function InboxPage() {
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [loading, setLoading] = useState(true);
    const [msgLoading, setMsgLoading] = useState(false);

    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !activeId) return;

        // In a real app, you would upload this file to S3/Cloud storage first,
        // then send the URL as the message content or attachment metadata.
        // For this demo, we'll just simulate sending a text message about the file.

        try {
            // Placeholder: simulate "uploading..."
            const text = `[Attachment: ${file.name}]`;

            const formData = new FormData();
            formData.append("conversationId", activeId);
            formData.append("content", text);
            // formData.append("file", file); // Backend would need to handle this

            await sendMessage(formData);
            await loadMessages(activeId);
        } catch (err) {
            console.error(err);
            alert("Failed to send attachment");
        } finally {
            if (e.target) e.target.value = "";
        }
    };

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (activeId) {
            loadMessages(activeId);
        }
    }, [activeId]);

    const loadConversations = async () => {
        try {
            const data = await getConversations();
            setConversations(data);
            if (data.length > 0 && !activeId) {
                setActiveId(data[0].id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (id) => {
        setMsgLoading(true);
        try {
            const data = await getMessages(id);
            setMessages(data);
        } catch (err) {
            console.error(err);
        } finally {
            setMsgLoading(false);
        }
    };

    const handleSend = async () => {
        if (!replyText || !activeId) return;
        const text = replyText;
        setReplyText("");
        try {
            const formData = new FormData();
            formData.append("conversationId", activeId);
            formData.append("content", text);
            // userId is handled by session normally, but let's pass a placeholder if needed

            await sendMessage(formData);
            await loadMessages(activeId);
        } catch (err) {
            console.error(err);
            setReplyText(text);
        }
    };

    const activeConversation = conversations.find(c => c.id === activeId);

    if (loading) return (
        <div className="h-full flex flex-col items-center justify-center py-20 bg-white space-y-4">
            <Loader2 className="animate-spin text-slate-400" size={32} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Messages...</p>
        </div>
    );

    return (
        <div className="flex bg-white font-sans text-slate-900 overflow-hidden h-full absolute inset-0">
            {/* 1. CONVERSATION LIST */}
            <aside className="w-80 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/30">
                <div className="p-6 border-b border-slate-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input
                            placeholder="Find chat..."
                            className="w-full h-10 bg-white border border-slate-200 rounded-lg pl-9 pr-4 text-xs font-medium focus:border-slate-900 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {conversations.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setActiveId(c.id)}
                            className={cn(
                                "w-full p-4 text-left border-b border-slate-100 transition-all flex items-start gap-3",
                                activeId === c.id ? "bg-white border-r-2 border-r-slate-900" : "hover:bg-white"
                            )}
                        >
                            <div className="w-9 h-9 rounded bg-slate-100 shrink-0 flex items-center justify-center font-bold text-slate-500 text-xs">
                                {c.contact.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h4 className="text-xs font-bold text-slate-900 truncate">{c.contact.name}</h4>
                                    <span className="text-[10px] font-bold text-slate-300">
                                        {c.messages[0] ? new Date(c.messages[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1 rounded uppercase tracking-tighter shrink-0">
                                        {c.messages[0]?.channel === 'EMAIL' ? '✉️' : c.messages[0]?.channel === 'SMS' ? '📱' : '📝'}
                                    </span>
                                    <p className="text-[11px] truncate text-slate-500 font-medium">
                                        {c.messages[0]?.content || "No messages yet"}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}

                    {conversations.length === 0 && (
                        <div className="p-12 text-center">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center">No active chats</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* 2. CHAT THREAD */}
            <main className="flex-1 flex flex-col min-w-0 bg-white shadow-2xl z-10">
                <header className="h-20 px-8 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200 shadow-sm">
                            {activeConversation?.contact?.name?.[0] || "?"}
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 leading-none mb-1">{activeConversation?.contact?.name}</h2>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Always Relaying</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-slate-50/20">
                    {msgLoading ? (
                        <div className="flex justify-center h-full items-center"><Loader2 className="animate-spin text-slate-200" /></div>
                    ) : (
                        messages.map((m) => (
                            <div key={m.id} className={cn(
                                "flex items-start gap-4 max-w-3xl animate-in fade-in duration-300",
                                m.sender === 'CUSTOMER' ? "flex-row" : "flex-row-reverse"
                            )}>
                                <div className={cn(
                                    "w-8 h-8 rounded flex items-center justify-center border shrink-0 text-xs shadow-sm shadow-slate-200/50",
                                    m.sender === 'SYSTEM' ? "bg-indigo-50 border-indigo-100 text-indigo-500" :
                                        m.sender === 'STAFF' ? "bg-slate-900 border-slate-900 text-white" :
                                            "bg-white border-slate-200 text-slate-400"
                                )}>
                                    {m.sender === 'SYSTEM' ? <Bot size={14} /> : <User size={14} />}
                                </div>

                                <div className={cn("flex flex-col gap-1.5", m.sender === 'CUSTOMER' ? "items-start" : "items-end")}>
                                    <div className={cn(
                                        "p-4 rounded-2xl text-sm font-medium leading-relaxed border shadow-sm transition-all",
                                        m.sender === 'CUSTOMER' ? "bg-white border-slate-200 text-slate-900 rounded-tl-none" :
                                            m.sender === 'SYSTEM' ? "bg-indigo-50/50 border-indigo-100 text-indigo-700 italic rounded-tr-none backdrop-blur-sm" :
                                                "bg-slate-900 border-slate-900 text-white rounded-tr-none"
                                    )}>
                                        {m.content}
                                    </div>
                                    <div className="flex items-center gap-2 px-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                                            {m.channel} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {messages.length === 0 && !msgLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
                            <MessageSquare className="text-slate-200" size={32} />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No message history</p>
                        </div>
                    )}
                </div>

                <footer className="p-4 bg-white border-t border-slate-200">
                    <div className="max-w-4xl mx-auto flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:bg-white focus-within:border-slate-400 focus-within:shadow-sm transition-all">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100 shrink-0 mb-0.5"
                        >
                            <Paperclip size={20} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={`Message ${activeConversation?.contact.name || 'client'}...`}
                            className="w-full max-h-32 min-h-[44px] py-3 bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400 resize-none font-medium leading-relaxed"
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!replyText.trim()}
                            className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 mb-0.5"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </footer>
            </main>
        </div>
    );
}
