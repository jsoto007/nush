import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
            <div className="w-full max-w-md rounded-[2.5rem] border border-stone-100 bg-white p-10 shadow-2xl shadow-stone-200/50">
                <div className="mb-10 text-center">
                    <h1 className="text-2xl font-black tracking-tighter text-stone-900 mb-8">
                        NUSH<span className="text-stone-400">.</span>
                    </h1>
                    <h2 className="text-3xl font-black tracking-tighter text-stone-900">Welcome back</h2>
                    <p className="mt-3 text-sm font-medium text-stone-500">Sign in to your account to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="ml-1 text-sm font-bold text-stone-900">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full rounded-2xl border-none bg-stone-100 px-5 py-4 text-sm font-bold text-stone-900 transition-all placeholder:text-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-sm font-bold text-stone-900">Password</label>
                            <Link
                                to="/forgot-password"
                                className="text-xs font-bold text-stone-400 transition hover:text-stone-900"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <input
                            type="password"
                            required
                            className="w-full rounded-2xl border-none bg-stone-100 px-5 py-4 text-sm font-bold text-stone-900 transition-all placeholder:text-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-900"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 ring-1 ring-red-100">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-2xl bg-stone-900 py-4 text-sm font-bold text-white shadow-lg shadow-stone-900/10 transition-all hover:bg-stone-800 hover:shadow-stone-900/20 active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm font-medium text-stone-500">
                    Don't have an account?{" "}
                    <Link to="/register" className="font-bold text-stone-900 hover:underline">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
};
