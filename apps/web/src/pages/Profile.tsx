import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Phone, Mail, Save, Loader2 } from "lucide-react";

export const Profile: React.FC = () => {
    const { user, api } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const response = await api.patch("/api/v1/auth/me", { name, phone });
            if (response.ok) {
                setMessage({ type: "success", text: "Profile updated successfully!" });
                // We might need to refresh user context if the API doesn't return updated user
            } else {
                setMessage({ type: "error", text: response.error || "Failed to update profile" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "An unexpected error occurred" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl py-8">
            <h1 className="mb-8 text-3xl font-black tracking-tight">Your Profile</h1>

            <form onSubmit={handleSave} className="space-y-6 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
                {message && (
                    <div className={`rounded-xl p-4 text-sm font-bold ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {message.text}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-stone-400">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-2xl border border-stone-100 bg-stone-50 py-4 pl-12 pr-4 font-medium outline-none transition focus:border-stone-900 focus:bg-white"
                            placeholder="Your name"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-stone-400">Email Address (Read-only)</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                        <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full cursor-not-allowed rounded-2xl border border-stone-100 bg-stone-50 py-4 pl-12 pr-4 font-medium text-stone-400 outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-stone-400">Phone Number</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full rounded-2xl border border-stone-100 bg-stone-50 py-4 pl-12 pr-4 font-medium outline-none transition focus:border-stone-900 focus:bg-white"
                            placeholder="Your phone number"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 font-bold text-white transition hover:bg-stone-800 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </form>
        </div>
    );
};
