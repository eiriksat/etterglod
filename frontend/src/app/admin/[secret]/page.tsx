"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

/** Stabil API-base */
const API = (() => {
    const env = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    if (typeof window === "undefined") {
        return process.env.NODE_ENV === "development"
            ? "http://localhost:4000"
            : env.startsWith("http") ? env : "https://api.etterglod.no";
    }
    return env.startsWith("http") ? env : "https://api.etterglod.no";
})();

/** Hindre Next fra å cache siden i build */
export const dynamic = "force-dynamic";

export default function Page() {
    // Hemmelig path guard: /admin/[secret]
    const { secret } = useParams<{ secret: string }>();
    const expected = (process.env.NEXT_PUBLIC_ADMIN_PATH || "").trim();
    const pathOK = Boolean(expected && secret === expected);

    const [password, setPassword] = useState("");
    const [token, setToken] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [ping, setPing] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Hent evt. eksisterende token fra sessionStorage
    useEffect(() => {
        if (typeof window === "undefined") return;
        const t = sessionStorage.getItem("eg_admin_jwt");
        if (t) setToken(t);
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
                body: JSON.stringify({ password }), // kun passord – backend krever ikke e-post
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.token) {
                // vis konkret feilmelding fra backend hvis vi har den
                setErr(typeof data?.error === "string" ? data.error : "Login failed");
                return;
            }
            sessionStorage.setItem("eg_admin_jwt", String(data.token));
            setToken(String(data.token));
            setPassword("");
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        } finally {
            setLoading(false);
        }
    }

    function logout() {
        sessionStorage.removeItem("eg_admin_jwt");
        setToken(null);
        setPing(null);
        setErr(null);
    }

    // Test beskyttet endepunkt når vi har token
    useEffect(() => {
        if (!token) return;
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch(`${API}/api/admin/ping`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                });

                // Ugyldig/utløpt token → logg ut stille
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

        return () => {
            cancelled = true;
        };
    }, [token]);

    if (!pathOK) {
        return (
            <main className="max-w-md mx-auto p-6 space-y-4">
                <h1 className="text-2xl font-semibold">Admin</h1>
                <div className="rounded border px-3 py-2 text-sm border-red-300 bg-red-50 text-red-800">
                    Feil adresse. Sjekk at URL inneholder riktig hemmelig path.
                </div>
            </main>
        );
    }

    if (!token) {
        return (
            <main className="max-w-md mx-auto p-6 space-y-4">
                <h1 className="text-2xl font-semibold">Admin</h1>
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
                <button onClick={logout} className="px-3 py-2 border rounded">
                    Logg ut
                </button>
            </div>

            {err && (
                <div className="rounded border px-3 py-2 text-sm border-red-300 bg-red-50 text-red-800">
                    {err}
                </div>
            )}

            <div className="rounded border p-4">
                <div className="font-medium mb-2">Tilgangstest</div>
                {ping ? (
                    <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(ping, null, 2)}
          </pre>
                ) : (
                    <div className="text-sm text-zinc-600">Pinger backend…</div>
                )}
            </div>
        </main>
    );
}