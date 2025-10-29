"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Stabil API-base: aldri undefined, aldri relativ
const API = (() => {
    const env = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    // Lokalt (node på server under dev) -> localhost
    if (typeof window === "undefined") {
        return process.env.NODE_ENV === "development"
            ? "http://localhost:4000"
            : (env.startsWith("http") ? env : "https://api.etterglod.no");
    }
    // I browseren -> bruk env hvis gyldig, ellers prod fallback
    return env.startsWith("http") ? env : "https://api.etterglod.no";
})();

type MemorialListItem = {
    slug: string;
    name: string;
    birthDate?: string | null;
    deathDate?: string | null;
    imageUrl?: string | null;
    ceremony?: { dateTime?: string | null; venue?: string | null; address?: string | null } | null;
};

export default function AdminDashboardPage() {
    const [items, setItems] = useState<MemorialListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                const res = await fetch(`${API}/api/memorials?take=100`);
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || `Feil (${res.status})`);
                setItems(json.items ?? []);
            } catch (e: any) {
                setErr(String(e.message || e));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <p className="p-6">Laster…</p>;
    if (err) return <p className="p-6 text-red-600">{err}</p>;

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-4">
            <h1 className="text-xl font-semibold">Administrasjon</h1>
            {items.length === 0 ? (
                <p>Ingen minnesider funnet.</p>
            ) : (
                <ul className="divide-y">
                    {items.map((m) => (
                        <li key={m.slug} className="py-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="font-medium truncate">{m.name}</div>
                                <div className="text-sm text-gray-600 truncate">
                                    {m.ceremony?.venue ?? "—"}{m.ceremony?.dateTime ? ` · ${new Date(m.ceremony.dateTime).toLocaleString()}` : ""}
                                </div>
                            </div>
                            <div className="shrink-0 flex gap-3">
                                <Link href={`/memorial/${m.slug}`} className="underline">Vis</Link>
                                <Link href={`/admin/${m.slug}`} className="underline">Moderér</Link>
                                <Link href={`/admin/${m.slug}/edit`} className="underline">Rediger</Link>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}