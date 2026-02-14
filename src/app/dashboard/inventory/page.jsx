"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Package,
    AlertTriangle,
    CheckCircle2,
    Plus,
    Loader2,
    Search,
    Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInventory } from "../dashboard-actions";

import { createInventoryItem, updateInventoryItem } from "../dashboard-actions";
import { X } from "lucide-react";

export default function InventoryPage() {
    const { data: session } = useSession();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        type: "CONSUMABLE",
        availableQuantity: 0,
        totalQuantity: 0,
        lowStockThreshold: 5
    });

    const isOwner = session?.user?.role === 'OWNER';

    useEffect(() => {
        loadInventory();
    }, []);

    async function loadInventory() {
        try {
            const data = await getInventory();
            setItems(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    function openAddModal() {
        setEditingItem(null);
        setFormData({
            name: "",
            type: "CONSUMABLE",
            availableQuantity: "",
            totalQuantity: 0,
            lowStockThreshold: ""
        });
        setIsModalOpen(true);
    }

    function openEditModal(item) {
        setEditingItem(item);
        setFormData({
            name: item.name,
            type: item.type,
            availableQuantity: item.availableQuantity,
            totalQuantity: item.totalQuantity,
            lowStockThreshold: item.lowStockThreshold
        });
        setIsModalOpen(true);
    }

    async function handleSave(e) {
        e.preventDefault();
        const data = new FormData();
        data.append("name", formData.name);
        data.append("type", formData.type);
        data.append("availableQuantity", Number(formData.availableQuantity));
        data.append("totalQuantity", 0);
        data.append("lowStockThreshold", Number(formData.lowStockThreshold));

        let result;
        if (editingItem) {
            data.append("id", editingItem.id);
            result = await updateInventoryItem(data);
        } else {
            result = await createInventoryItem(data);
        }

        if (result?.success) {
            setIsModalOpen(false);
            loadInventory();
        } else {
            alert("Failed to save item. Ensure all fields are valid.");
        }
    }

    if (loading) return (
        <div className="h-full flex items-center justify-center py-20 bg-white">
            <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
    );

    return (
        <div className="p-8 lg:p-12 space-y-10 relative">
            <div className="max-w-6xl mx-auto space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resource Inventory</h1>
                        <p className="text-sm text-slate-500">Monitor clinical supplies and reusable practice resources.</p>
                    </div>

                    {isOwner && (
                        <button
                            onClick={openAddModal}
                            className="h-10 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10"
                        >
                            <Plus size={14} /> Add Item
                        </button>
                    )}
                </div>

                {/* Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatusCard
                        label="Stock Level"
                        value={items.filter(i => i.availableQuantity > i.lowStockThreshold).length}
                        status="Healthy"
                        icon={CheckCircle2}
                        color="text-emerald-500"
                    />
                    <StatusCard
                        label="Low Stock Items"
                        value={items.filter(i => i.availableQuantity <= i.lowStockThreshold).length}
                        status="Warning"
                        icon={AlertTriangle}
                        color="text-orange-500"
                    />
                    <StatusCard
                        label="Total Items"
                        value={items.length}
                        status="Monitored"
                        icon={Package}
                        color="text-blue-500"
                    />
                </div>

                {/* Inventory Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                            <input
                                type="text"
                                placeholder="Search inventory..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 text-xs font-medium focus:bg-white focus:border-slate-900 outline-none transition-all"
                            />
                        </div>
                        <button className="h-10 px-4 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                            <Filter size={14} /> Filter
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resource Name</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Threshold</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    {isOwner && <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{item.name}</div>
                                            <div className="text-[10px] text-slate-400">ID: {item.id.substring(0, 8)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            {item.availableQuantity}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium">
                                            {item.lowStockThreshold}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    item.availableQuantity <= item.lowStockThreshold ? "bg-rose-500" : "bg-emerald-500"
                                                )} />
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-widest",
                                                    item.availableQuantity <= item.lowStockThreshold ? "text-rose-500" : "text-emerald-500"
                                                )}>
                                                    {item.availableQuantity <= item.lowStockThreshold ? "Low Stock" : "Available"}
                                                </span>
                                            </div>
                                        </td>
                                        {isOwner && (
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredItems.length === 0 && (
                            <div className="p-20 text-center">
                                <Package className="mx-auto text-slate-200 mb-4" size={48} />
                                <p className="text-sm font-medium text-slate-400">No inventory items found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ADD/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                {editingItem ? "Edit Resource" : "Add New Resource"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Resource Name</label>
                                <input
                                    required
                                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-medium focus:border-slate-900 outline-none transition-all"
                                    placeholder="e.g. Laser Tip 5mm"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Type</label>
                                <select
                                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-2 text-sm font-medium focus:border-slate-900 outline-none transition-all"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="CONSUMABLE">Consumable</option>
                                    <option value="ASSET">Fixed Asset</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Stock Count</label>
                                    <input
                                        type="number"
                                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-medium focus:border-slate-900 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={formData.availableQuantity}
                                        onChange={e => setFormData({ ...formData, availableQuantity: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Warning Threshold</label>
                                    <input
                                        type="number"
                                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-medium focus:border-slate-900 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={formData.lowStockThreshold}
                                        onChange={e => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 h-10 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 h-10 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                                >
                                    {editingItem ? 'Save Changes' : 'Create Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusCard({ label, value, status, icon: Icon, color }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2 rounded-lg bg-slate-50 border border-slate-100", color)}>
                    <Icon size={18} />
                </div>
                <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-slate-50", color)}>
                    {status}
                </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        </div>
    );
}
