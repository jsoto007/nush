import React, { useState } from "react";
import { X, Store, Phone, Mail, Users } from "lucide-react";
import { type ApiResponse, type Restaurant } from "@repo/shared";
import { useAuth } from "../../../context/AuthContext";

interface CreateRestaurantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (restaurant: Restaurant) => void;
}

export const CreateRestaurantModal: React.FC<CreateRestaurantModalProps> = ({ isOpen, onClose, onCreated }) => {
    const { api } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [ownerEmail, setOwnerEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const response = await api.post<{ restaurant: Restaurant }>("/api/v1/admin/restaurants", {
            name,
            email,
            phone,
            owner_email: ownerEmail || null,
            status: "active"
        });

        if (response.ok && response.data) {
            onCreated(response.data.restaurant);
            onClose();
            setName("");
            setEmail("");
            setPhone("");
            setOwnerEmail("");
        } else {
            setError(response.error || "Failed to create restaurant");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b border-stone-100 p-6">
                    <h2 className="text-xl font-black tracking-tight">New Restaurant</h2>
                    <button onClick={onClose} className="rounded-xl p-2 hover:bg-stone-100 transition">
                        <X size={20} className="text-stone-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-stone-400 ml-1">Restaurant Name</label>
                        <div className="relative flex items-center group">
                            <Store className="absolute left-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={18} />
                            <input
                                required
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-2xl bg-stone-100 py-3.5 pl-12 pr-4 text-sm font-bold outline-none transition focus:bg-white focus:ring-2 focus:ring-stone-900/5"
                                placeholder="e.g. The Burger Joint"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-stone-400 ml-1">Public Email</label>
                        <div className="relative flex items-center group">
                            <Mail className="absolute left-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={18} />
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-2xl bg-stone-100 py-3.5 pl-12 pr-4 text-sm font-bold outline-none transition focus:bg-white focus:ring-2 focus:ring-stone-900/5"
                                placeholder="hello@restaurant.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-stone-400 ml-1">Phone Number</label>
                        <div className="relative flex items-center group">
                            <Phone className="absolute left-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={18} />
                            <input
                                required
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full rounded-2xl bg-stone-100 py-3.5 pl-12 pr-4 text-sm font-bold outline-none transition focus:bg-white focus:ring-2 focus:ring-stone-900/5"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-stone-400 ml-1">Initial Owner Email (Optional)</label>
                        <div className="relative flex items-center group">
                            <Users className="absolute left-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={18} />
                            <input
                                type="email"
                                value={ownerEmail}
                                onChange={(e) => setOwnerEmail(e.target.value)}
                                className="w-full rounded-2xl bg-stone-100 py-3.5 pl-12 pr-4 text-sm font-bold outline-none transition focus:bg-white focus:ring-2 focus:ring-stone-900/5"
                                placeholder="owner@example.com"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full rounded-2xl bg-stone-900 py-4 text-sm font-black text-white transition hover:bg-stone-800 disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Restaurant"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
