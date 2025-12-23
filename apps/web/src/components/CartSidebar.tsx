import React from "react";
import { useCart } from "../context/CartContext";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CartSidebar: React.FC = () => {
    const { cart, updateQuantity, isOpen, setIsOpen, loading } = useCart();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const items = cart?.items || [];
    const totals = cart?.totals;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div
                className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOpen(false)}
            />

            <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between border-b border-stone-100 p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-white">
                            <ShoppingBag size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-stone-900">Your Cart</h2>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="rounded-xl p-2 text-stone-400 transition hover:bg-stone-50 hover:text-stone-900"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading && items.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 size={32} className="animate-spin text-stone-300" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <div className="mb-4 rounded-full bg-stone-50 p-6 text-stone-200">
                                <ShoppingBag size={48} />
                            </div>
                            <h3 className="text-lg font-bold text-stone-900">Cart is empty</h3>
                            <p className="mt-1 text-sm text-stone-500">Add some delicious items to get started!</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-stone-50">
                                        <img
                                            src={`https://source.unsplash.com/featured/?food,${item.name_snapshot}`}
                                            alt={item.name_snapshot}
                                            className="h-full w-full rounded-xl object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-1 flex-col">
                                        <div className="flex justify-between">
                                            <h4 className="font-bold text-stone-900">{item.name_snapshot}</h4>
                                            <span className="font-bold text-stone-900">
                                                ${(item.total_price_cents / 100).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="flex items-center gap-3 rounded-lg bg-stone-100 p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-stone-900 shadow-sm transition hover:bg-stone-900 hover:text-white"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-stone-900 shadow-sm transition hover:bg-stone-900 hover:text-white"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {items.length > 0 && totals && (
                    <div className="border-t border-stone-100 bg-stone-50/50 p-6">
                        <div className="space-y-2 mb-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-stone-500">Subtotal</span>
                                <span className="font-bold text-stone-900">${(totals.subtotal_cents / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-stone-500">Fees & Tax</span>
                                <span className="font-bold text-stone-900">${((totals.tax_cents + totals.fee_cents) / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                                <span className="text-stone-900 font-bold">Total</span>
                                <span className="text-2xl font-black text-stone-900">
                                    ${(totals.total_cents / 100).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                navigate("/checkout");
                            }}
                            disabled={loading}
                            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-stone-900 py-4 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : "Proceed to Checkout"}
                            {!loading && <ArrowRight size={18} className="transition group-hover:translate-x-1" />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
