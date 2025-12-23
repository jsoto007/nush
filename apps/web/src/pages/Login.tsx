import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await login(email, password);
        if (result.ok) {
            navigate("/");
        } else {
            setError(result.error || "Failed to login");
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
            <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-200/40">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-white">
                        <LogIn size={24} />
                    </div>
                    <h1 className="text-2xl font-semibold text-stone-900">Welcome back</h1>
                    <p className="mt-2 text-stone-500">Sign in to your account to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Email Address</label>
                        <input
                            type="email"
                            required
                            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm transition focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Password</label>
                        <input
                            type="password"
                            required
                            className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm transition focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && <div className="text-sm text-red-600">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-stone-500">
                    Don't have an account?{" "}
                    <a href="/register" className="font-semibold text-stone-900 hover:underline">
                        Create one
                    </a>
                </p>
            </div>
        </div>
    );
};
