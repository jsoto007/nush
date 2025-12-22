import { useState } from "react";
import { getApiBaseUrl, type HealthResponse } from "@repo/shared";

const apiBaseUrl = getApiBaseUrl(import.meta.env.VITE_API_URL);

function App() {
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handlePing = async () => {
    setLoading(true);
    setError("");
    setStatus("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/health`);
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      const data = (await response.json()) as HealthResponse;
      setStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-white to-amber-50">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6">
        <div className="rounded-3xl border border-stone-200 bg-white/70 p-8 shadow-xl shadow-stone-200/40 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-stone-500">nush</p>
          <h1 className="mt-4 text-4xl font-semibold text-stone-900">
            Calm, focused app starter
          </h1>
          <p className="mt-3 text-base text-stone-600">
            Ping the API to verify the stack is live.
          </p>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              onClick={handlePing}
              disabled={loading}
            >
              {loading ? "Pinging..." : "Ping API"}
            </button>
            <div className="text-sm text-stone-500">
              Base URL: <span className="font-mono text-stone-700">{apiBaseUrl}</span>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-3 text-sm">
            {status && <p className="text-green-700">Status: {status}</p>}
            {error && <p className="text-red-700">Error: {error}</p>}
            {!status && !error && <p className="text-stone-500">Awaiting response.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
