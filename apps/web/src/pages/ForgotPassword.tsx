import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { ApiClient, getApiBaseUrl } from "@repo/shared";

const api = new ApiClient(getApiBaseUrl(import.meta.env.VITE_API_URL));

export const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post("/api/v1/auth/forgot-password", { email });
            if (!response.ok) {
                throw new Error(response.error || "Failed to process request. Please try again.");
            }

            setSubmitted(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-xl shadow-stone-200/50 ring-1 ring-stone-100">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-600 mb-6">
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter text-stone-900">Check your email</h2>
                        <p className="mt-4 text-sm font-medium text-stone-500 leading-relaxed">
                            We've sent a password reset link to <span className="text-stone-900 font-bold">{email}</span>. Please check your inbox and follow the instructions.
                        </p>
                    </div>

                    <div className="mt-8 space-y-4">
                        <Link
                            to="/login"
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-stone-900/10 transition-all hover:bg-stone-800 hover:shadow-stone-900/20 active:scale-[0.98]"
                        >
                            Back to Login
                        </Link>
                        <button
                            onClick={() => setSubmitted(false)}
                            className="w-full text-sm font-bold text-stone-400 hover:text-stone-900 transition"
                        >
                            Didn't receive an email? Try again
                        </button>
                    </div>
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
                    <h2 className="text-3xl font-black tracking-tighter text-stone-900">Reset Password</h2>
                    <p className="mt-4 text-sm font-medium text-stone-500">
                        Enter your email and we'll send you a link to reset your password.
                    </p>
                </div>

                <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 ring-1 ring-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label htmlFor="email" className="text-sm font-bold text-stone-900 ml-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
                                <Mail size={18} />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-2xl border-none bg-stone-100 py-4 pl-12 pr-4 text-sm font-bold text-stone-900 ring-2 ring-transparent transition-all placeholder:text-stone-400 focus:bg-white focus:ring-stone-900"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-stone-900/10 transition-all hover:bg-stone-800 hover:shadow-stone-900/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                Send Reset Link
                            </>
                        )}
                    </button>
                </form>

                <div className="flex justify-center">
                    <Link
                        to="/login"
                        className="flex items-center gap-2 text-sm font-bold text-stone-400 transition hover:text-stone-900"
                    >
                        <ArrowLeft size={16} />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};
