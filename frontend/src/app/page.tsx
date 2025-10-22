"use client";

import { useState, useEffect } from "react";

export default function HomePage() {
    const api = process.env.NEXT_PUBLIC_API_URL!;
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${api}/api/health`)
            .then((r) => r.json())
            .then(setHealth)
            .finally(() => setLoading(false));
    }, [api]);

    return (
        <main className="p-6 max-w-xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Etterglød</h1>

            <section className="rounded border p-4">
                <h2 className="font-medium mb-2">API-status</h2>
                <pre className="text-sm bg-gray-50 p-3 rounded">
          {loading ? "Laster…" : JSON.stringify(health, null, 2)}
        </pre>
            </section>

            <ContactForm api={api} />
        </main>
    );
}

function ContactForm({ api }: { api: string }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch(`${api}/api/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message }),
            });

            const data = await res.json();

            // 📋 Sjekk om API svarte med feil
            if (!res.ok) {
                setResult({ ok: false, data });
                return;
            }

            // ✅ Vellykket innsending
            setResult({ ok: true, data });
            setName("");
            setEmail("");
            setMessage("");
        } catch (err: any) {
            // ⚠️ Nettverksfeil, uventede feil etc.
            setResult({ ok: false, data: { error: String(err) } });
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="rounded border p-4">
            <h2 className="font-medium mb-2">Kontakt</h2>
            <form onSubmit={onSubmit} className="space-y-3">
                <div>
                    <label className="block text-sm">Navn</label>
                    <input
                        className="w-full border rounded px-3 py-2"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm">E-post</label>
                    <input
                        className="w-full border rounded px-3 py-2"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm">Melding</label>
                    <textarea
                        className="w-full border rounded px-3 py-2 min-h-[100px]"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>
                <button
                    disabled={loading}
                    className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
                >
                    {loading ? "Sender…" : "Send"}
                </button>
            </form>

            {result && (
                <pre className="text-sm bg-gray-50 p-3 rounded mt-3">
          {JSON.stringify(result, null, 2)}
        </pre>
            )}
        </section>
    );
}