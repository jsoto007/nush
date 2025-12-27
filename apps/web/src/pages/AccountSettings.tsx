import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Lock, Bell, Shield, Loader2, Save } from "lucide-react";

export const AccountSettings: React.FC = () => {
    const { api } = useAuth();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match" });
            return;
        }

        setLoading(true);
        setMessage(null);
        try {
            const response = await api.post("/api/v1/auth/reset-password", {
                current_password: currentPassword, // Assuming backend might need this for security
                password: newPassword,
            });
            if (response.ok) {
                setMessage({ type: "success", text: "Password updated successfully!" });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setMessage({ type: "error", text: response.error || "Failed to update password" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "An unexpected error occurred" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl py-8">
            <h1 className="mb-8 text-3xl font-black tracking-tight">Account Settings</h1>

            <div className="space-y-8">
                {/* Security Section */}
                <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
                    <div className="mb-6 flex items-center gap-3 text-stone-900">
                        <Lock size={20} />
                        <h2 className="text-xl font-bold">Security</h2>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-6">
                        {message && (
                            <div className={`rounded-xl p-4 text-sm font-bold ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-stone-400">Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full rounded-2xl border border-stone-100 bg-stone-50 p-4 font-medium outline-none transition focus:border-stone-900 focus:bg-white"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-wider text-stone-400">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full rounded-2xl border border-stone-100 bg-stone-50 p-4 font-medium outline-none transition focus:border-stone-900 focus:bg-white"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-wider text-stone-400">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-2xl border border-stone-100 bg-stone-50 p-4 font-medium outline-none transition focus:border-stone-900 focus:bg-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 font-bold text-white transition hover:bg-stone-800 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {loading ? "Updating..." : "Update Password"}
                        </button>
                    </form>
                </section>

                {/* Notifications Section */}
                <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
                    <div className="mb-6 flex items-center gap-3 text-stone-900">
                        <Bell size={20} />
                        <h2 className="text-xl font-bold">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            { id: "orders", label: "Order Updates", desc: "Get notified about your order status" },
                            { id: "promos", label: "Promotions & Offers", desc: "Receive updates on sales and discounts" },
                            { id: "newsletter", label: "Weekly Newsletter", desc: "Our favorite picks and news" }
                        ].map((pref) => (
                            <label key={pref.id} className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-stone-50 bg-stone-50/50 p-4 transition hover:bg-stone-50">
                                <div>
                                    <p className="font-bold text-stone-900">{pref.label}</p>
                                    <p className="text-sm text-stone-500">{pref.desc}</p>
                                </div>
                                <input type="checkbox" defaultChecked className="h-5 w-5 rounded-lg border-stone-300 text-stone-900 focus:ring-stone-900" />
                            </label>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};
