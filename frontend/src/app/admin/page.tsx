"use client";
import { useEffect, useState } from "react";

const API = (() => {
    const env = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    if (typeof window === "undefined") {
        return process.env.NODE_ENV === "development"
            ? "http://localhost:4000"
            : env.startsWith("http") ? env : "https://api.etterglod.no";
    }
    return env.startsWith("http") ? env : "https://api.etterglod.no";
})();

export default function AdminPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [token, setToken] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        setToken(localStorage.getItem("eg_admin_jwt"));
    }, []);

    async function login(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        const res = await fetch(`${API}/api/admin/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.token) {
            setErr(data?.error || "Login failed");
            return;
        }
        localStorage.setItem("eg_admin_jwt", data.token);
        setToken(data.token);
    }

    function logout() {
        localStorage.removeItem("eg_admin_jwt");
        setToken(null);
    }

    if (!token) {
        return (
            <main className="max-w-md mx-auto p-6 space-y-4">
                <h1 className="text-2xl font-semibold">Admin</h1>
                {err && <div className="text-sm text-red-600">{err}</div>}
                <form onSubmit={login} className="space-y-3">
                    <input className="w-full border rounded px-3 py-2"
                           placeholder="E-post"
                           type="email" value={email}
                           onChange={(e) => setEmail(e.target.value)} />
                    <input className="w-full border rounded px-3 py-2"
                           placeholder="Passord"
                           type="password" value={password}
                           onChange={(e) => setPassword(e.target.value)} />
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

            {/* Eksempel: hent protected data */}
            <AdminDashboard token={token} />
        </main>
    );
}

function AdminDashboard({ token }: { token: string }) {
    const [ping, setPing] = useState<any>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API}/api/admin/ping`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(setPing)
            .catch((e) => setErr(String(e)));
    }, [token]);

    return (
        <div className="rounded border p-4">
            <div className="font-medium mb-2">Tilgangstest</div>
            {err && <div className="text-sm text-red-600">Feil: {err}</div>}
            {ping && <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(ping, null, 2)}</pre>}
        </div>
    );
}