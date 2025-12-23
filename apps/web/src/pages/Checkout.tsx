import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { CreditCard, MapPin, Clock, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { type Order } from "@repo/shared";

export const Checkout: React.FC = () => {
    const { cart, clearCart } = useCart();
    const { api } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [successOrder, setSuccessOrder] = useState<Order | null>(null);

    if (!cart || cart.items.length === 0) {
        if (successOrder) return (
            <div className="mx-auto max-w-2xl py-20 text-center">
                <div className="mb-8 flex justify-center">
                    <div className="rounded-full bg-green-50 p-6 text-green-500">
                        <CheckCircle2 size={64} />
                    </div>
                </div>
                <h1 className="text-4xl font-black text-stone-900">Order Confirmed!</h1>
                <p className="mt-4 text-lg text-stone-500">
                    Your order <span className="font-bold text-stone-900">#{successOrder.id.slice(0, 8)}</span> has been placed.
                </p>
                <div className="mt-12 flex flex-col gap-4">
                    <button
                        onClick={() => navigate("/")}
                        className="rounded-2xl bg-stone-900 py-4 font-bold text-white transition hover:bg-stone-800"
                    >
                        Track Order Status
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="text-sm font-bold text-stone-400 hover:text-stone-900"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );

        return (
            <div className="p-20 text-center">
                <h2 className="text-2xl font-bold">Your cart is empty</h2>
                <button onClick={() => navigate("/")} className="mt-4 text-stone-900 underline">Go browse restaurants</button>
            </div>
        );
    }

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            const response = await api.post<{ order: Order }>("/api/v1/checkout/confirm", {
                cart_id: cart.id
            });
            if (response.ok && response.data) {
                setSuccessOrder(response.data.order);
                clearCart();
            } else {
                alert(response.error || "Failed to place order");
            }
        } catch (err) {
            console.error(err);
            alert("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl py-8">
            <h1 className="mb-12 text-4xl font-black tracking-tight text-stone-900">Checkout</h1>

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    {/* Delivery Section */}
                    <div className="rounded-3xl border border-stone-200 bg-white p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-50 text-stone-900">
                                <MapPin size={20} />
                            </div>
                            <h2 className="text-xl font-bold">Delivery Details</h2>
                        </div>
                        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-6">
                            <p className="font-bold text-stone-900">Home</p>
                            <p className="mt-1 text-stone-500">123 Maple Avenue, Apt 4B</p>
                            <p className="text-stone-500">Brooklyn, NY 11201</p>
                            <button className="mt-4 text-sm font-bold text-stone-900 underline">Edit Address</button>
                        </div>
                    </div>

                    {/* Payment Section */}
                    <div className="rounded-3xl border border-stone-200 bg-white p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-50 text-stone-900">
                                <CreditCard size={20} />
                            </div>
                            <h2 className="text-xl font-bold">Payment Method</h2>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border-2 border-stone-900 bg-stone-50 p-6">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-12 rounded bg-stone-200"></div>
                                <div>
                                    <p className="font-bold">•••• 4242</p>
                                    <p className="text-xs text-stone-400">Expires 12/26</p>
                                </div>
                            </div>
                            <CheckCircle2 size={24} className="text-stone-900" />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-24 rounded-3xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-200/50">
                        <h2 className="mb-6 text-xl font-bold">Order Summary</h2>
                        <div className="mb-8 space-y-4">
                            {cart.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-stone-500">
                                        <span className="font-bold text-stone-900">{item.quantity}x</span> {item.name_snapshot}
                                    </span>
                                    <span className="font-bold text-stone-900">
                                        ${(item.total_price_cents / 100).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 border-t border-stone-100 pt-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-stone-500">Subtotal</span>
                                <span className="font-medium">${(cart.totals.subtotal_cents / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-stone-500">Delivery Fee</span>
                                <span className="font-medium">${(cart.totals.fee_cents / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-stone-500">Estimated Tax</span>
                                <span className="font-medium">${(cart.totals.tax_cents / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-4 text-xl font-black text-stone-900">
                                <span>Total</span>
                                <span>${(cart.totals.total_cents / 100).toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading}
                            className="group mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-stone-900 py-4 font-bold text-white transition hover:bg-stone-800 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : "Place Order"}
                            {!loading && <ArrowRight size={18} className="transition group-hover:translate-x-1" />}
                        </button>

                        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                            <Clock size={12} />
                            <span>Estimated arrival: 25-35 min</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
