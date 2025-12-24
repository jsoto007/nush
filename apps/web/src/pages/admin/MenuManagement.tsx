import React, { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { type Restaurant, type Menu, type MenuItem, type MenuCategory } from "@repo/shared";
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";

export const MenuManagement: React.FC = () => {
    const { restaurant } = useOutletContext<{ restaurant: Restaurant }>();
    const { api } = useAuth();
    const [menus, setMenus] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchMenus = async () => {
            // Using the public menu endpoint which returns the active menu
            const response = await api.get<Menu>(`/api/v1/restaurants/${restaurant.id}/menu`);
            if (response.ok && response.data) {
                setMenus([response.data]);
                // Expand the first category of the menu by default
                if (response.data.categories.length > 0) {
                    setExpandedCategories({ [response.data.categories[0].id]: true });
                }
            }
            setLoading(false);
        };

        fetchMenus();
    }, [api, restaurant.id]);

    const toggleCategory = (id: string) => {
        setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

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
                    <h2 className="text-2xl font-black tracking-tight">Menu Management</h2>
                    <p className="text-stone-500 font-medium">Create and organize your restaurant's offerings.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-bold transition hover:border-stone-900">
                        <Plus size={16} />
                        New Category
                    </button>
                    <button className="flex items-center gap-2 rounded-2xl bg-stone-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-stone-800">
                        <Plus size={16} />
                        New Item
                    </button>
                </div>
            </div>

            {menus.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[30vh] border-2 border-dashed border-stone-200 rounded-3xl">
                    <p className="text-stone-500 font-bold text-lg">No menus found</p>
                    <button className="mt-4 rounded-2xl bg-stone-900 px-6 py-2.5 text-sm font-bold text-white uppercase tracking-tighter">Create Initial Menu</button>
                </div>
            ) : (
                <div className="space-y-6">
                    {menus[0].categories.map((category) => (
                        <div key={category.id} className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition-all hover:shadow-md">
                            <div
                                onClick={() => toggleCategory(category.id)}
                                className="flex cursor-pointer items-center justify-between bg-stone-50/50 px-6 py-4 transition-colors hover:bg-stone-100/50"
                            >
                                <div className="flex items-center gap-4">
                                    <GripVertical size={16} className="text-stone-300 cursor-grab" />
                                    <h3 className="font-black text-stone-900 uppercase tracking-tight">{category.name}</h3>
                                    <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-black text-stone-600">
                                        {category.items.length} ITEMS
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button className="rounded-xl p-2 text-stone-400 transition hover:bg-stone-200 hover:text-stone-900">
                                        <Edit2 size={16} />
                                    </button>
                                    <div className="h-4 w-px bg-stone-200" />
                                    {expandedCategories[category.id] ? <ChevronDown size={20} className="text-stone-400" /> : <ChevronRight size={20} className="text-stone-400" />}
                                </div>
                            </div>

                            {expandedCategories[category.id] && (
                                <div className="divide-y divide-stone-100 bg-white px-6">
                                    {category.items.length === 0 ? (
                                        <div className="py-8 text-center text-stone-400 text-sm font-medium">
                                            No items in this category yet.
                                        </div>
                                    ) : (
                                        category.items.map((item) => (
                                            <div key={item.id} className="group flex items-center justify-between py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-stone-100 flex items-center justify-center font-bold text-stone-400">
                                                        {item.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-stone-900">{item.name}</h4>
                                                        <p className="text-xs text-stone-500 font-medium line-clamp-1 max-w-sm">
                                                            {item.description || "No description provided."}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-stone-900">
                                                            ${(item.base_price_cents / 100).toFixed(2)}
                                                        </p>
                                                        {item.track_stock && (
                                                            <p className={`text-[10px] font-bold uppercase ${item.stock_quantity && item.stock_quantity > 0 ? "text-green-600" : "text-red-500"}`}>
                                                                {item.stock_quantity || 0} in stock
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                                        <button className="rounded-xl p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button className="rounded-xl p-2 text-stone-400 transition hover:bg-stone-100 hover:text-red-500">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <button className="w-full py-4 text-center text-xs font-black uppercase tracking-widest text-stone-400 transition hover:text-stone-900">
                                        + Add Item to {category.name}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
