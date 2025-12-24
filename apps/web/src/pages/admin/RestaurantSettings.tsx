import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { type Restaurant } from "@repo/shared";
import { Store, Phone, Mail, Tag, Save, Check } from "lucide-react";

export const RestaurantSettings: React.FC = () => {
    const { restaurant: initialRestaurant } = useOutletContext<{ restaurant: Restaurant }>();
    const { api } = useAuth();
    const [restaurant, setRestaurant] = useState(initialRestaurant);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const response = await api.patch<{ restaurant: Restaurant }>(`/api/v1/restaurant-admin/restaurants/${restaurant.id}`, {
            name: restaurant.name,
            phone: restaurant.phone,
            email: restaurant.email,
            cuisines: restaurant.cuisines,
            status: restaurant.status
        });

        setSaving(false);
        if (response.ok && response.data) {
            setRestaurant(response.data.restaurant);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } else {
            alert(response.error);
        }
    };

    return (
        <div className="max-w-2xl">
            <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight">Restaurant Settings</h2>
                <p className="text-stone-500 font-medium">Update your restaurant's profile and contact information.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 ml-1 flex items-center gap-2">
                            <Store size={12} />
                            Restaurant Name
                        </label>
                        <input
                            type="text"
                            value={restaurant.name}
                            onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
                            className="w-full rounded-2xl border border-stone-200 px-5 py-3.5 text-base font-bold outline-none transition focus:border-stone-900"
                            required
                        />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 ml-1 flex items-center gap-2">
                                <Phone size={12} />
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={restaurant.phone || ""}
                                onChange={(e) => setRestaurant({ ...restaurant, phone: e.target.value })}
                                className="w-full rounded-2xl border border-stone-200 px-5 py-3.5 text-base font-bold outline-none transition focus:border-stone-900"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 ml-1 flex items-center gap-2">
                                <Mail size={12} />
                                Public Email
                            </label>
                            <input
                                type="email"
                                value={restaurant.email || ""}
                                onChange={(e) => setRestaurant({ ...restaurant, email: e.target.value })}
                                className="w-full rounded-2xl border border-stone-200 px-5 py-3.5 text-base font-bold outline-none transition focus:border-stone-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 ml-1 flex items-center gap-2">
                            <Tag size={12} />
                            Cuisines (comma separated)
                        </label>
                        <input
                            type="text"
                            value={restaurant.cuisines.join(", ")}
                            onChange={(e) => setRestaurant({ ...restaurant, cuisines: e.target.value.split(",").map(c => c.trim()) })}
                            className="w-full rounded-2xl border border-stone-200 px-5 py-3.5 text-base font-bold outline-none transition focus:border-stone-900"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 ml-1">
                            Operational Status
                        </label>
                        <div className="flex gap-4">
                            {["active", "inactive", "suspended"].map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setRestaurant({ ...restaurant, status: status as any })}
                                    className={`flex-1 rounded-2xl py-3 text-sm font-black uppercase tracking-tight transition ${restaurant.status === status
                                            ? "bg-stone-900 text-white shadow-lg shadow-stone-200"
                                            : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-stone-100">
                    <p className="text-xs text-stone-400 font-bold">Last updated: just now</p>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-2xl bg-stone-900 px-8 py-4 text-sm font-black text-white transition hover:bg-stone-800 disabled:opacity-50"
                    >
                        {saving ? (
                            "Saving..."
                        ) : saved ? (
                            <>
                                <Check size={18} />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
