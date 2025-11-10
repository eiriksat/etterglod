"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

/** Stabil API-base */
const API = (() => {
    const env = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    if (typeof window === "undefined") {
        return process.env.NODE_ENV === "development"
            ? "http://localhost:4000"
            : env.startsWith("http")
                ? env
                : "https://api.etterglod.no";
    }
    return env.startsWith("http") ? env : "https://api.etterglod.no";
})();

/** Hindre Next fra å cache siden i build */
export const dynamic = "force-dynamic";

/* ====================== Hjelpefunksjoner + typer ====================== */

function downloadCsv(rows: any[], filename = "attendance_export.csv") {
    const header = ["id", "name", "email", "allergies", "waitlisted"];
    const lines = [
        header.join(","),
        ...rows.map((r) =>
            [
                r.id,
                JSON.stringify(r.name ?? "").slice(1, -1),
                JSON.stringify(r.email ?? "").slice(1, -1),
                JSON.stringify(r.allergies ?? "").slice(1, -1),
                r.waitlisted ? "1" : "0",
            ].join(",")
        ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

function useAdminApi(token: string) {
    async function jget<T>(path: string) {
        const res = await fetch(path, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return (await res.json()) as T;
    }
    async function jpost<T>(path: string, body?: any) {
        const res = await fetch(path, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return (await res.json()) as T;
    }
    return { jget, jpost };
}

type MemorialLite = { id: number; slug: string; name: string };
type Summary = {
    ok: true;
    totalConfirmed: number;
    totalWaitlisted: number;
    entriesConfirmed: number;
    entriesWaitlisted: number;
    capacity: number;
};
type Row = {
    id: number;
    name: string;
    email: string;
    allergies?: string | null;
    waitlisted: boolean;
};

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded border p-3">
            <div className="text-xs text-zinc-500">{label}</div>
            <div className="text-xl font-semibold">{value}</div>
        </div>
    );
}
function Th({ children }: { children: React.ReactNode }) {
    return <th className="text-left px-3 py-2 font-medium">{children}</th>;
}
function Td({
                children,
                className = "",
            }: {
    children: React.ReactNode;
    className?: string;
}) {
    return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}

/* ============================ Dashboard ============================ */

function AdminDashboard({ token }: { token: string }) {
    const [memorials, setMemorials] = useState<MemorialLite[]>([]);
    const [slug, setSlug] = useState<string>("");
    const [summary, setSummary] = useState<Summary | null>(null);
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const { jget, jpost } = useAdminApi(token);

    // Last minnesider
    useEffect(() => {
        let cancel = false;
        (async () => {
            try {
                setErr(null);
                const data = await jget<{ items: MemorialLite[] }>(
                    `${API}/api/memorials`
                );
                if (!cancel) {
                    setMemorials(data.items || []);
                    if (data.items?.length && !slug) setSlug(data.items[0].slug);
                }
            } catch (e: any) {
                if (!cancel) setErr(String(e?.message ?? e));
            }
        })();
        return () => {
            cancel = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Last summary + attendance når slug endres
    useEffect(() => {
        if (!slug) return;
        let cancel = false;
        (async () => {
            try {
                setLoading(true);
                setErr(null);
                const [sum, att] = await Promise.all([
                    jget<Summary>(`${API}/api/memorials/${slug}/attendance/summary`),
                    jget<{ items: Row[] }>(`${API}/api/memorials/${slug}/attendance`),
                ]);
                if (!cancel) {
                    setSummary(sum);
                    setRows(att.items || []);
                }
            } catch (e: any) {
                if (!cancel) setErr(String(e?.message ?? e));
            } finally {
                if (!cancel) setLoading(false);
            }
        })();
        return () => {
            cancel = true;
        };
    }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

    async function reconcile() {
        if (!slug) return;
        try {
            setLoading(true);
            setErr(null);
            await jpost(`${API}/api/memorials/${slug}/attendance/reconcile`);
            // refresh data etter reconcile
            const [sum, att] = await Promise.all([
                jget<Summary>(`${API}/api/memorials/${slug}/attendance/summary`),
                jget<{ items: Row[] }>(`${API}/api/memorials/${slug}/attendance`),
            ]);
            setSummary(sum);
            setRows(att.items || []);
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Toppkontroller */}
            <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm">
                    Minneside:&nbsp;
                    <select
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="border rounded px-2 py-1"
                    >
                        {memorials.map((m) => (
                            <option key={m.id} value={m.slug}>
                                {m.name} ({m.slug})
                            </option>
                        ))}
                    </select>
                </label>

                <button
                    onClick={() => downloadCsv(rows, `attendance_${slug || "all"}.csv`)}
                    className="px-3 py-2 rounded border"
                    disabled={!rows.length}
                    title="Eksporter synlig liste til CSV"
                >
                    Last ned CSV
                </button>

                <button
                    onClick={reconcile}
                    className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
                    disabled={!slug || loading}
                    title="Promoter venteliste der kapasitet finnes"
                >
                    Reconcile venteliste
                </button>

                {loading && <span className="text-sm text-zinc-500">Laster…</span>}
            </div>

            {err && (
                <div className="rounded border px-3 py-2 text-sm border-red-300 bg-red-50 text-red-800">
                    {err}
                </div>
            )}

            {/* Nøkkeltall */}
            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <Stat label="Kapasitet" value={summary.capacity} />
                    <Stat label="Påmeldt (tot.)" value={summary.totalConfirmed} />
                    <Stat label="Venteliste (tot.)" value={summary.totalWaitlisted} />
                    <Stat label="Rader bekreftet" value={summary.entriesConfirmed} />
                    <Stat label="Rader venteliste" value={summary.entriesWaitlisted} />
                </div>
            )}

            {/* Tabell */}
            <div className="overflow-x-auto rounded border">
                <table className="min-w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/40">
                    <tr>
                        <Th>ID</Th>
                        <Th>Navn</Th>
                        <Th>E-post</Th>
                        <Th>Allergier</Th>
                        <Th>Waitlist</Th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((r) => (
                        <tr key={r.id} className="border-t">
                            <Td className="tabular-nums">{r.id}</Td>
                            <Td className="font-medium">{r.name}</Td>
                            <Td className="text-zinc-600 dark:text-zinc-300">{r.email}</Td>
                            <Td className="text-zinc-600 dark:text-zinc-300">
                                {r.allergies || ""}
                            </Td>
                            <Td>{r.waitlisted ? "Ja" : "Nei"}</Td>
                        </tr>
                    ))}
                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-4 text-center text-zinc-500">
                                Ingen rader.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ============================== Page ============================== */

export default function Page() {
    // Hemmelig path guard: /admin/[secret]
    const { secret } = useParams<{ secret: string }>();
    const expected = (process.env.NEXT_PUBLIC_ADMIN_PATH || "").trim();
    const pathOK = Boolean(expected && secret === expected);

    const [password, setPassword] = useState("");
    const [token, setToken] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
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
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }), // kun passord – backend krever ikke e-post
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.token) {
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
        setErr(null);
    }

    if (!pathOK) {
        return (
            <main className="max-w-md mx-auto p-6 space-y-4">
                <h1 className="text-2xl font-semibold">Admin</h1>
                <div className="rounded border px-3 py-2 text-sm border-red-300 bg-red-50 text-red-800">
                    Feil adresse. Sjekk at URL inneholder riktig hemmelig path.
                </div>
                <div className="rounded border p-3 text-sm">
                    <div>
                        <b>secret fra URL:</b> {String(secret)}
                    </div>
                    <div>
                        <b>ENV expected:</b> {expected || "(tom)"}
                    </div>
                    <div>
                        <b>Path OK?</b> {pathOK ? "ja" : "nei"}
                    </div>
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
        <main className="max-w-5xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Admin</h1>
                <button onClick={logout} className="px-3 py-2 border rounded">
                    Logg ut
                </button>
            </div>

            <AdminDashboard token={token} />
        </main>
    );
}