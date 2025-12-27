import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { ApiClient, getApiBaseUrl } from "@repo/shared";

const api = new ApiClient(getApiBaseUrl(import.meta.env.VITE_API_URL));

export const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus("error");
                setMessage("Invalid verification link.");
                return;
            }

            try {
                const response = await api.post<{ message?: string }>("/api/v1/auth/verify-email", { token });
                if (response.ok) {
                    setStatus("success");
                    setMessage(response.data?.message || "Email verified! You can now access all features.");
                } else {
                    setStatus("error");
                    setMessage(response.error || "Verification failed. The link may have expired.");
                }
            } catch (err) {
                setStatus("error");
                setMessage("An error occurred during verification. Please try again later.");
            }
        };

        verify();
    }, [token]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-xl shadow-stone-200/50 ring-1 ring-stone-100">
                <div className="text-center">
                    <h1 className="text-2xl font-black tracking-tighter text-stone-900 mb-8">
                        NUSH<span className="text-stone-400">.</span>
                    </h1>

                    {status === "loading" && (
                        <div className="flex flex-col items-center">
                            <Loader2 className="h-12 w-12 animate-spin text-stone-400 mb-4" />
                            <h2 className="text-2xl font-black tracking-tighter text-stone-900">Verifying Email...</h2>
                            <p className="mt-2 text-sm font-medium text-stone-500">Just a moment while we confirm your account.</p>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-600 mb-6">
                                <CheckCircle2 size={32} />
                            </div>
                            <h2 className="text-3xl font-black tracking-tighter text-stone-900">Email Verified!</h2>
                            <p className="mt-4 text-sm font-medium text-stone-500 leading-relaxed mb-8">
                                {message}
                            </p>
                            <Link
                                to="/login"
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-stone-900/10 transition-all hover:bg-stone-800 hover:shadow-stone-900/20 active:scale-[0.98]"
                            >
                                Back to Login
                            </Link>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex flex-col items-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-6">
                                <XCircle size={32} />
                            </div>
                            <h2 className="text-3xl font-black tracking-tighter text-stone-900">Verification Failed</h2>
                            <p className="mt-4 text-sm font-medium text-stone-500 leading-relaxed mb-8">
                                {message}
                            </p>
                            <Link
                                to="/login"
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-stone-900/10 transition-all hover:bg-stone-800 hover:shadow-stone-900/20 active:scale-[0.98]"
                            >
                                Back to Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
