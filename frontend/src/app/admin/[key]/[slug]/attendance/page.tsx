"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

// Robust API-base (aldri undefined)
const API =
    process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith("http")
        ? process.env.NEXT_PUBLIC_API_URL
        : (typeof window === "undefined" ? "http://localhost:4000" : "https://api.etterglod.no");

const TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "";
const ADMIN_GUID = process.env.NEXT_PUBLIC_ADMIN_GUID ?? "";

// Midlertidig tak (kan flyttes til DB senere)
const CAP = 60;

type Item = {
    id: number;
    name: string;
    email: string;
    plusOne: boolean;
    allergies?: string | null;
    notes?: string | null;
    createdAt: string;
};

export default function AdminAttendancePage() {
    // ✅ Punkt 2: Les både key og slug fra ruten (støtt også ?k= som fallback)
    const params = useParams<{ key: string; slug: string }>();
    const search = useSearchParams();
    const keyParam = params?.key || search.get("k") || "";
    const slug = params?.slug;

    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // Enkel “skjuling” bak GUID i URL
    if (!keyParam || !ADMIN_GUID || keyParam !== ADMIN_GUID) {
        return (
            <main className="p-6 max-w-3xl mx-auto">
                <h1 className="text-xl font-semibold">404</h1>
                <p>Finner ikke siden.</p>
            </main>
        );
    }

    useEffect(() => {
        (async () => {
            if (!slug) return;
            setLoading(true);
            setErr(null);
            try {
                const res = await fetch(`${API}/api/memorials/${slug}/attendance`, {
                    headers: { Authorization: `Bearer ${TOKEN}` },
                    cache: "no-store",
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || `Feil (${res.status})`);
                setItems(json.items ?? []);
            } catch (e: any) {
                setErr(String(e.message || e));
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    const { totalGuests, plusOnes, remaining } = useMemo(() => {
        const plus = items.filter((i) => i.plusOne).length;
        const total = items.length + plus; // 1 per rad + 1 for hver +1
        return {
            totalGuests: total,
            plusOnes: plus,
            remaining: Math.max(0, CAP - total),
        };
    }, [items]);

    return (
        <main className="p-6 max-w-4xl mx-auto space-y-6">
            <header className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Påmeldinger – {slug}</h1>
                <div className="flex gap-3">
                    <Link className="underline" href={`/memorial/${slug}`}>Åpne minneside</Link>
                    {/* Merk: Direkte CSV-lenke vil ikke sende Authorization-header fra browseren */}
                    <a
                        className="underline"
                        href={`${API}/api/memorials/${slug}/attendance.csv`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Last ned CSV
                    </a>
                </div>
            </header>

            <section className="rounded border p-4">
                <h2 className="font-medium mb-2">Oppsummering</h2>
                <div className="text-sm grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div><span className="text-gray-600">Antall påmeldte (rader):</span> {items.length}</div>
                    <div><span className="text-gray-600">Antall +1:</span> {plusOnes}</div>
                    <div><span className="text-gray-600">Totalt antall gjester:</span> {totalGuests} / {CAP}</div>
                </div>
            </section>

            <section className="rounded border">
                <div className="p-4 border-b font-medium">Liste</div>
                {loading ? (
                    <p className="p-4">Laster…</p>
                ) : err ? (
                    <p className="p-4 text-red-600">{err}</p>
                ) : items.length === 0 ? (
                    <p className="p-4">Ingen påmeldinger ennå.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="text-left p-2">Navn</th>
                                <th className="text-left p-2">E-post</th>
                                <th className="text-left p-2">+1</th>
                                <th className="text-left p-2">Allergier</th>
                                <th className="text-left p-2">Notater</th>
                                <th className="text-left p-2">Tid</th>
                            </tr>
                            </thead>
                            <tbody>
                            {items.map((i) => (
                                <tr key={i.id} className="border-b">
                                    <td className="p-2">{i.name}</td>
                                    <td className="p-2">{i.email}</td>
                                    <td className="p-2">{i.plusOne ? "Ja" : "Nei"}</td>
                                    <td className="p-2">{i.allergies || "—"}</td>
                                    <td className="p-2">{i.notes || "—"}</td>
                                    <td className="p-2">
                                        {new Intl.DateTimeFormat("nb-NO", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        }).format(new Date(i.createdAt))}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}