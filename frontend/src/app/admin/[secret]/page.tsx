"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Stabil API-base
const API = (() => {
    const env = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    if (typeof window === "undefined") {
        return process.env.NODE_ENV === "development"
            ? "http://localhost:4000"
            : env.startsWith("http") ? env : "https://api.etterglod.no";
    }
    return env.startsWith("http") ? env : "https://api.etterglod.no";
})();

// Valgfritt: tving modul-eksport så TS aldri misforstår
export const dynamic = "force-dynamic";

export default function Page() {
    // Hemmelig path guard: /admin/[secret]
    const { secret } = useParams<{ secret: string }>();
    const expected = (process.env.NEXT_PUBLIC_ADMIN_PATH || "").trim();
    const pathOK = expected && secret === expected;

    const [password, setPassword] = useState("");
    const [token, setToken] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [ping, setPing] = useState<any>(null);

    useEffect(() => {
        const t = typeof window !== "undefined" ? sessionStorage.getItem("eg_admin_jwt") : null;
        if (t) setToken(t);
    }, []);

    async function login(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setPing(null);
        try {
            const res = await fetch(`${API}/api/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.token) {
                setErr(data?.error || "Login failed");
                return;
            }
            sessionStorage.setItem("eg_admin_jwt", data.token as string);
            setToken(data.token as string);
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        }
    }

    function logout() {
        sessionStorage.removeItem("eg_admin_jwt");
        setToken(null);
        setPing(null);
    }

    useEffect(() => {
        if (!token) return;
        fetch(`${API}/api/admin/ping`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        })
            .then(r => r.json())
            .then(setPing)
            .catch((e) => setErr(String(e)));
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
                {err && <div className="text-sm text-red-600">{err}</div>}
                <form onSubmit={login} className="space-y-3">
                    <input
                        className="w-full border rounded px-3 py-2"
                        placeholder="Admin-passord"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button className="px-4 py-2 rounded bg-black text-white">Logg inn</button>
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

            {err && <div className="text-sm text-red-600">{err}</div>}

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