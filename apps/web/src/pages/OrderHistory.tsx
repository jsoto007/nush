import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ShoppingBag, Clock, ChevronRight, Loader2 } from "lucide-react";
import { type Order } from "@repo/shared";
import { useNavigate } from "react-router-dom";

export const OrderHistory: React.FC = () => {
    const { api } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get<{ orders: Order[] }>("/api/v1/orders");
            if (response.ok && response.data) {
                setOrders(response.data.orders);
            }
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-stone-300" size={40} />
                <p className="mt-4 font-bold text-stone-500">Loading your orders...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl py-8">
            <h1 className="mb-8 text-3xl font-black tracking-tight">Order History</h1>

            {orders.length === 0 ? (
                <div className="rounded-3xl border border-stone-100 bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-50 text-stone-400">
                        <ShoppingBag size={32} />
                    </div>
                    <h2 className="text-xl font-bold">No orders yet</h2>
                    <p className="mt-2 text-stone-500">When you place an order, it will appear here.</p>
                    <button
                        onClick={() => navigate("/")}
                        className="mt-8 rounded-2xl bg-stone-900 px-8 py-3 font-bold text-white transition hover:bg-stone-800"
                    >
                        Browse Restaurants
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            onClick={() => navigate(`/checkout`)} // Assuming a detail view or just redirecting back for now
                            className="group flex cursor-pointer items-center justify-between rounded-3xl border border-stone-200 bg-white p-6 transition hover:border-stone-900/10 hover:shadow-xl hover:shadow-stone-200/50"
                        >
                            <div className="flex items-center gap-6">
                                <div className="hidden h-16 w-16 items-center justify-center rounded-2xl bg-stone-50 text-stone-400 sm:flex">
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-stone-900">Order #{order.id.slice(0, 8)}</span>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${order.status === "completed" ? "bg-green-50 text-green-600" : "bg-stone-100 text-stone-500"
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm font-medium text-stone-500">
                                        {new Date(order.placed_at).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric"
                                        })}
                                    </p>
                                    <p className="mt-2 text-sm font-bold text-stone-900">
                                        ${(order.totals.total_cents / 100).toFixed(2)} • {order.items?.length || 0} items
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-xl p-2 text-stone-400 transition group-hover:bg-stone-50 group-hover:text-stone-900">
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
