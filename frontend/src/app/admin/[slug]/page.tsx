"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL!;
const TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN!;

export default function AdminMemorialPage() {
    const params = useParams() as { slug: string };
    const slug = params.slug;

    const [pending, setPending] = useState<any[]>([]);
    const [approved, setApproved] = useState<any[]>([]);
    const [msg, setMsg] = useState<string | null>(null);

    async function load() {
        try {
            const res = await fetch(`${API}/api/memorials/${slug}/memory/pending`, {
                headers: { Authorization: `Bearer ${TOKEN}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Feil ved henting");
            setPending(data.items || []);
        } catch (e: any) {
            setMsg(e.message);
        }

        try {
            const res2 = await fetch(`${API}/api/memorials/${slug}`);
            const data2 = await res2.json();
            setApproved(data2.item?.notes || []);
        } catch {}
    }

    async function approve(id: number) {
        await fetch(`${API}/api/memorials/${slug}/memory/${id}/approve`, {
            method: "POST",
            headers: { Authorization: `Bearer ${TOKEN}` },
        });
        load();
    }

    useEffect(() => {
        load();
    }, [slug]);

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <h1 className="text-xl font-semibold">Admin – {slug}</h1>

            <div className="flex gap-2">
                <Link
                    href={`/memorial/${slug}`}
                    className="underline text-blue-600 hover:text-blue-800"
                >
                    Åpne minneside
                </Link>
                <Link
                    href={`/admin/${slug}/edit`}
                    className="underline text-blue-600 hover:text-blue-800"
                >
                    Rediger detaljer
                </Link>
            </div>

            {msg && <p className="text-sm text-red-600">{msg}</p>}

            <section>
                <h2 className="font-medium text-lg mb-2">Ventende minneord</h2>
                {pending.length === 0 ? (
                    <p>Ingen ventende minneord.</p>
                ) : (
                    <ul className="space-y-2">
                        {pending.map((n) => (
                            <li key={n.id} className="border rounded p-3">
                                <div className="font-medium">{n.author}</div>
                                <p className="text-sm whitespace-pre-line">{n.text}</p>
                                <button
                                    onClick={() => approve(n.id)}
                                    className="mt-2 px-3 py-1 text-sm bg-black text-white rounded hover:opacity-90"
                                >
                                    Godkjenn
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section>
                <h2 className="font-medium text-lg mb-2">Godkjente minneord</h2>
                {approved.length === 0 ? (
                    <p>Ingen godkjente minneord.</p>
                ) : (
                    <ul className="space-y-2">
                        {approved.map((n) => (
                            <li key={n.id} className="border rounded p-3">
                                <div className="font-medium">{n.author}</div>
                                <p className="text-sm whitespace-pre-line">{n.text}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}