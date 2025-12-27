import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Lock, CheckCircle2, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { ApiClient, getApiBaseUrl } from "@repo/shared";

const api = new ApiClient(getApiBaseUrl(import.meta.env.VITE_API_URL));

export const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token.");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.post("/api/v1/auth/reset-password", { token, password });
            if (!response.ok) {
                throw new Error(response.error || "Failed to reset password.");
            }

            setSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-xl shadow-stone-200/50 ring-1 ring-stone-100">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-600 mb-6">
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter text-stone-900">Password Reset</h2>
                        <p className="mt-4 text-sm font-medium text-stone-500 leading-relaxed">
                            Your password has been successfully updated. Redirecting you to login...
                        </p>
                    </div>
                    <Link
                        to="/login"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-stone-900/10 transition-all hover:bg-stone-800 hover:shadow-stone-900/20 active:scale-[0.98]"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-xl shadow-stone-200/50 ring-1 ring-stone-100">
                <div className="text-center">
                    <h1 className="text-2xl font-black tracking-tighter text-stone-900 mb-2">
                        NUSH<span className="text-stone-400">.</span>
                    </h1>
                    <h2 className="text-3xl font-black tracking-tighter text-stone-900">Set New Password</h2>
                    <p className="mt-4 text-sm font-medium text-stone-500">
                        Please choose a strong password you haven't used before.
                    </p>
                </div>

                <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 ring-1 ring-red-100">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-sm font-bold text-stone-900 ml-1">
                                New Password
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-2xl border-none bg-stone-100 py-4 pl-12 pr-12 text-sm font-bold text-stone-900 ring-2 ring-transparent transition-all placeholder:text-stone-400 focus:bg-white focus:ring-stone-900"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-stone-400 hover:text-stone-900 transition"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="confirmPassword" className="text-sm font-bold text-stone-900 ml-1">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full rounded-2xl border-none bg-stone-100 py-4 pl-12 pr-4 text-sm font-bold text-stone-900 ring-2 ring-transparent transition-all placeholder:text-stone-400 focus:bg-white focus:ring-stone-900"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !token}
                        className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-stone-900/10 transition-all hover:bg-stone-800 hover:shadow-stone-900/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                Reset Password
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
