import React, { useState } from "react";
import { X, User, Mail, Lock, Shield } from "lucide-react";
import { type ApiResponse, type User as UserType } from "@repo/shared";
import { useAuth } from "../../../context/AuthContext";

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (user: UserType) => void;
    defaultRole?: string;
    showRoleSelector?: boolean;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
    isOpen,
    onClose,
    onCreated,
    defaultRole = "customer",
    showRoleSelector = false
}) => {
    const { api } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState(defaultRole);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const response = await api.post<{ user: UserType }>("/api/v1/admin/users", {
            name,
            email,
            password,
            role
        });

        if (response.ok && response.data) {
            onCreated(response.data.user);
            onClose();
            setName("");
            setEmail("");
            setPassword("");
        } else {
            setError(response.error || "Failed to create user");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b border-stone-100 p-6">
                    <h2 className="text-xl font-black tracking-tight">Create New User</h2>
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
                        <label className="text-xs font-black uppercase tracking-wider text-stone-400 ml-1">Full Name</label>
                        <div className="relative flex items-center group">
                            <User className="absolute left-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={18} />
                            <input
                                required
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-2xl bg-stone-100 py-3.5 pl-12 pr-4 text-sm font-bold outline-none transition focus:bg-white focus:ring-2 focus:ring-stone-900/5"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-stone-400 ml-1">Email Address</label>
                        <div className="relative flex items-center group">
                            <Mail className="absolute left-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={18} />
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-2xl bg-stone-100 py-3.5 pl-12 pr-4 text-sm font-bold outline-none transition focus:bg-white focus:ring-2 focus:ring-stone-900/5"
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-stone-400 ml-1">Password</label>
                        <div className="relative flex items-center group">
                            <Lock className="absolute left-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={18} />
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-2xl bg-stone-100 py-3.5 pl-12 pr-4 text-sm font-bold outline-none transition focus:bg-white focus:ring-2 focus:ring-stone-900/5"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {showRoleSelector && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-stone-400 ml-1">System Role</label>
                            <div className="relative flex items-center group">
                                <Shield className="absolute left-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={18} />
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full rounded-2xl bg-stone-100 py-3.5 pl-12 pr-4 text-sm font-bold outline-none transition focus:bg-white focus:ring-2 focus:ring-stone-900/5 appearance-none"
                                >
                                    <option value="customer">Customer</option>
                                    <option value="restaurant_owner">Restaurant Owner</option>
                                    <option value="admin">Platform Admin</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full rounded-2xl bg-stone-900 py-4 text-sm font-black text-white transition hover:bg-stone-800 disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Account"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
