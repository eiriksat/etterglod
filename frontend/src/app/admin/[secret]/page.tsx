"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

/** API base (client-safe) */
const API = (() => {
    const env = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    if (typeof window === "undefined") {
        return process.env.NODE_ENV === "development"
            ? "http://localhost:4000"
            : env.startsWith("http") ? env : "https://api.etterglod.no";
    }
    return env.startsWith("http") ? env : "https://api.etterglod.no";
})();

/** Baked-in at build time */
const EXPECTED = (process.env.NEXT_PUBLIC_ADMIN_PATH || "").trim();

/** Avoid static optimization */
export const dynamic = "force-dynamic";

export default function Page() {
    const { secret } = useParams<{ secret: string }>();
    const pathOK = Boolean(EXPECTED && secret === EXPECTED);

    const [password, setPassword] = useState("");
    const [token, setToken] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [ping, setPing] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Pick up existing token
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const t = sessionStorage.getItem("eg_admin_jwt");
            if (t) setToken(t);
        } catch {}
    }, []);

    async function login(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setPing(null);
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }), // only password
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.token) {
                setErr(typeof data?.error === "string" ? data.error : "Login failed");
                return;
            }
            try {
                sessionStorage.setItem("eg_admin_jwt", String(data.token));
            } catch {}
            setToken(String(data.token));
            setPassword("");
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        } finally {
            setLoading(false);
        }
    }

    function logout() {
        try {
            sessionStorage.removeItem("eg_admin_jwt");
        } catch {}
        setToken(null);
        setPing(null);
        setErr(null);
    }

    // Probe protected route when token appears
    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${API}/api/admin/ping`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                });
                if (res.status === 401 || res.status === 403) {
                    if (!cancelled) logout();
                    return;
                }
                const data = await res.json().catch(() => ({}));
                if (!cancelled) setPing(data);
            } catch (e: any) {
                if (!cancelled) setErr(String(e?.message ?? e));
            }
        })();
        return () => { cancelled = true; };
    }, [token]);

    if (!pathOK) {
        return (
            <main className="max-w-md mx-auto p-6 space-y-4">
                <h1 className="text-2xl font-semibold">Admin</h1>
                <div className="rounded border px-3 py-2 text-sm border-red-300 bg-red-50 text-red-800">
                    Feil adresse. Sjekk at URL inneholder riktig hemmelig path.
                </div>
                <div className="text-xs text-zinc-600">
                    <div><span className="font-medium">Baked EXPECTED:</span> <code>{EXPECTED || "(tom/ikke satt)"}</code></div>
                    <div><span className="font-medium">URL secret:</span> <code>{String(secret)}</code></div>
                </div>
            </main>
        );
    }

    if (!token) {
        return (
            <main className="max-w-md mx-auto p-6 space-y-4">
                <h1 className="text-2xl font-semibold">Admin</h1>

                {/* tiny status strip */}
                <div className="text-xs text-zinc-600 space-y-1">
                    <div><span className="font-medium">API:</span> <code>{API}</code></div>
                    <div><span className="font-medium">EXPECTED:</span> <code>{EXPECTED || "(tom/ikke satt)"}</code></div>
                    <div><span className="font-medium">URL secret:</span> <code>{String(secret)}</code></div>
                </div>

                {err && (
                    <div className="rounded border px-3 py-2 text-sm border-red-300 bg-red-50 text-red-800">
                        {err}
                    </div>
                )}

                <form onSubmit={login} className="space-y-3">
                    <input
                        className="w-full border rounded px-3 py-2"
                        placeholder="Admin-passord"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />
                    <button
                        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? "Logger inn…" : "Logg inn"}
                    </button>
                </form>
            </main>
        );
    }

    return (
        <main className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Admin</h1>
                <button onClick={logout} className="px-3 py-2 border rounded">Logg ut</button>
            </div>

            {err && (
                <div className="rounded border px-3 py-2 text-sm border-red-300 bg-red-50 text-red-800">
                    {err}
                </div>
            )}

            <div className="rounded border p-4">
                <div className="font-medium mb-2">Tilgangstest</div>
                {ping ? (
                    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(ping, null, 2)}</pre>
                ) : (
                    <div className="text-sm text-zinc-600">Pinger backend…</div>
                )}
            </div>
        </main>
    );
}