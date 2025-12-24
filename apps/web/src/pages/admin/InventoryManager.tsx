import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { type Restaurant, type Menu, type MenuItem } from "@repo/shared";
import { Package, Search, Save, Check, RefreshCw } from "lucide-react";

export const InventoryManager: React.FC = () => {
    const { restaurant } = useOutletContext<{ restaurant: Restaurant }>();
    const { api } = useAuth();
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [success, setSuccess] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchItems = async () => {
            const response = await api.get<Menu>(`/api/v1/restaurants/${restaurant.id}/menu`);
            if (response.ok && response.data) {
                const allItems: MenuItem[] = [];
                response.data.categories.forEach(cat => {
                    allItems.push(...cat.items);
                });
                setItems(allItems);
            }
            setLoading(false);
        };

        fetchItems();
    }, [api, restaurant.id]);

    const handleUpdateStock = async (itemId: string, quantity: number, track: boolean) => {
        setSaving(prev => ({ ...prev, [itemId]: true }));
        const response = await api.patch<{ item: MenuItem }>(`/api/v1/restaurant-admin/items/${itemId}/stock`, {
            stock_quantity: quantity,
            track_stock: track
        });

        setSaving(prev => ({ ...prev, [itemId]: false }));
        if (response.ok) {
            setSuccess(prev => ({ ...prev, [itemId]: true }));
            setTimeout(() => setSuccess(prev => ({ ...prev, [itemId]: false })), 2000);

            setItems(items.map(item => item.id === itemId ? response.data!.item : item));
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-[40vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black tracking-tight">Inventory Manager</h2>
                    <p className="text-stone-500 font-medium">Quickly update stock levels across your entire menu.</p>
                </div>
                <div className="relative w-64">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 py-2.5 text-sm font-medium outline-none focus:border-stone-900"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-stone-100 bg-stone-50/50">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Item Name</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Tracking</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Current Stock</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                        {filteredItems.map((item) => (
                            <tr key={item.id} className="group transition-colors hover:bg-stone-50/50">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-stone-900">{item.name}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleUpdateStock(item.id, item.stock_quantity || 0, !item.track_stock)}
                                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider transition ${item.track_stock
                                            ? "bg-stone-900 text-white"
                                            : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                                            }`}
                                    >
                                        {item.track_stock ? "Enabled" : "Disabled"}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            defaultValue={item.stock_quantity || 0}
                                            disabled={!item.track_stock}
                                            onBlur={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (val !== item.stock_quantity) {
                                                    handleUpdateStock(item.id, val, item.track_stock);
                                                }
                                            }}
                                            className="w-20 rounded-xl border border-stone-200 px-3 py-1.5 text-sm font-black outline-none focus:border-stone-900 disabled:bg-stone-50 disabled:text-stone-300"
                                        />
                                        {item.track_stock && item.stock_quantity !== undefined && item.stock_quantity <= 5 && (
                                            <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 uppercase">
                                                Low stock
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end">
                                        {saving[item.id] ? (
                                            <RefreshCw size={16} className="animate-spin text-stone-400" />
                                        ) : success[item.id] ? (
                                            <Check size={16} className="text-green-600" />
                                        ) : (
                                            <div className="h-4 w-4" />
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredItems.length === 0 && (
                    <div className="py-20 text-center font-bold text-stone-400">
                        No items matching your search.
                    </div>
                )}
            </div>
        </div>
    );
};
