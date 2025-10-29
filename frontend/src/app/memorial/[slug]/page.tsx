"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "development"
        ? "http://localhost:4000"
        : "https://api.etterglod.no");

// Midlertidig visningstekst/typer for welcome scope (kan komme fra DB senere)
type WelcomeScope = "open" | "family" | "private";
function welcomeLabel(scope: WelcomeScope) {
    switch (scope) {
        case "open":
            return "Alle som ønsker å delta";
        case "family":
            return "Familie og slekt";
        case "private":
            return "Kun de nærmeste";
    }
}

// 🔸 Midlertidig MOCK for minnestund (reception) – byttes til DB senere
const receptionMock: {
    dateTime: string;
    venue: string;
    address?: string;
    mapUrl?: string;
    welcomeScope: WelcomeScope;
    wishes?: string;
} = {
    dateTime: "2025-11-01T13:30:00+01:00",
    venue: "Menighetshuset",
    address: "Eksempelveien 12, Trondheim",
    mapUrl: "https://maps.example",
    welcomeScope: "open",
    wishes:
        "Familien ønsker en rolig minnestund med enkel servering. Del gjerne små minner eller bilder.",
};

type Memorial = {
    slug: string;
    name: string;
    birthDate?: string | null;
    deathDate?: string | null;
    bio?: string | null;
    imageUrl?: string | null;
    ceremony?: {
        dateTime: string;
        venue: string;
        address?: string | null;
        mapUrl?: string | null;
        livestream?: string | null;
    } | null;
    notes: { id: number; author: string; text: string; createdAt: string }[];
};

export default function MemorialPage() {
    const params = useParams<{ slug: string }>();
    const slug = params?.slug;

    const [memorial, setMemorial] = useState<Memorial | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Toggle for å vise påmeldingsskjema inne i Minnestund-kortet
    const [showRsvp, setShowRsvp] = useState(false);

    async function refresh() {
        if (!slug) return;
        try {
            const res = await fetch(`${API}/api/memorials/${slug}`, { cache: "no-store" });
            if (!res.ok) throw new Error(`Kunne ikke hente minnesiden (${res.status})`);
            const json = await res.json();
            setMemorial(json.item as Memorial);
        } catch (e: any) {
            setError(String(e?.message ?? e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    if (loading) return <main className="p-6 max-w-3xl mx-auto">Laster minneside…</main>;
    if (error) return <main className="p-6 max-w-3xl mx-auto">Feil: {error}</main>;
    if (!memorial) return <main className="p-6 max-w-3xl mx-auto">Ingen data funnet.</main>;

    const birth = memorial.birthDate ? new Date(memorial.birthDate).toLocaleDateString() : "";
    const death = memorial.deathDate ? new Date(memorial.deathDate).toLocaleDateString() : "";

    return (
        <main className="p-6 max-w-3xl mx-auto space-y-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-semibold">{memorial.name}</h1>
                <p className="text-gray-600">{[birth, death].filter(Boolean).join(" – ")}</p>
                {memorial.bio && <p className="mt-2 leading-relaxed">{memorial.bio}</p>}
            </header>

            {/* SEREMONI (kirke) */}
            <section className="rounded border p-4 space-y-3">
                <h2 className="font-medium text-lg">Seremoni</h2>
                {memorial.ceremony ? (
                    <div className="text-sm space-y-1">
                        <div>
                            <span className="text-gray-600">Tid:</span>{" "}
                            {new Date(memorial.ceremony.dateTime).toLocaleString()}
                        </div>
                        <div>
                            <span className="text-gray-600">Sted:</span> {memorial.ceremony.venue}
                        </div>
                        {memorial.ceremony.address && (
                            <div>
                                <span className="text-gray-600">Adresse:</span> {memorial.ceremony.address}
                            </div>
                        )}
                        {memorial.ceremony.mapUrl && (
                            <a className="underline" href={memorial.ceremony.mapUrl} target="_blank">
                                Åpne kirke i kart
                            </a>
                        )}
                        {memorial.ceremony.livestream && (
                            <a className="underline ml-2" href={memorial.ceremony.livestream} target="_blank">
                                Livestream
                            </a>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-gray-600">Detaljer kommer.</p>
                )}
            </section>

            {/* MINNESTUND (eget lokale) – inntil DB/Backend er helt på plass bruker vi receptionMock for visning */}
            <section className="rounded border p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <h2 className="font-medium text-lg">Minnestund</h2>
                    <button
                        onClick={() => setShowRsvp((v) => !v)}
                        className="px-3 py-2 rounded bg-black text-white hover:opacity-90"
                    >
                        {showRsvp ? "Lukk påmelding" : "Meld deg på"}
                    </button>
                </div>

                <div className="text-sm space-y-1">
                    <div>
                        <span className="text-gray-600">Tid:</span>{" "}
                        {new Date(receptionMock.dateTime).toLocaleString()}
                    </div>
                    <div>
                        <span className="text-gray-600">Sted:</span> {receptionMock.venue}
                    </div>
                    {receptionMock.address && (
                        <div>
                            <span className="text-gray-600">Adresse:</span> {receptionMock.address}
                        </div>
                    )}
                    <div>
                        <span className="text-gray-600">Velkommen:</span>{" "}
                        {welcomeLabel(receptionMock.welcomeScope)}
                    </div>
                    {receptionMock.mapUrl && (
                        <a className="underline" href={receptionMock.mapUrl} target="_blank">
                            Åpne minnestund i kart
                        </a>
                    )}
                    {receptionMock.wishes && (
                        <div className="pt-2">
                            <div className="text-gray-600">Ønsker for minnestunden:</div>
                            <p className="whitespace-pre-wrap">{receptionMock.wishes}</p>
                        </div>
                    )}
                </div>

                {/* Påmeldingsskjema inni Minnestund-kortet */}
                {showRsvp && (
                    <div className="mt-4 border-t pt-4">
                        <RSVPForm
                            slug={memorial.slug}
                            onSuccess={() => {
                                // Vis enkel takkmelding i stedet for å navigere
                                alert("Takk! Påmeldingen er registrert.");
                                setShowRsvp(false);
                                // optional: refresh(); // hvis du vil hente evt. teller senere
                            }}
                            onCancel={() => setShowRsvp(false)}
                        />
                    </div>
                )}
            </section>

            {/* Minneord-listing (kan stå, selv om innsendelse ikke er viktig nå) */}
            <section className="rounded border p-4">
                <h2 className="font-medium text-lg mb-2">Minneord (godkjente)</h2>
                {memorial.notes?.length ? (
                    <ul className="space-y-3">
                        {memorial.notes.map((n) => (
                            <li key={n.id} className="border rounded p-3">
                                <p className="whitespace-pre-wrap">{n.text}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                    — {n.author} · {new Date(n.createdAt).toLocaleString()}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-600">Ingen minneord ennå.</p>
                )}
            </section>
        </main>
    );
}

/* ------------------- Påmeldingsskjema ------------------- */

function RSVPForm({
                      slug,
                      onSuccess,
                      onCancel,
                  }: {
    slug: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [plusOne, setPlusOne] = useState(false);
    const [allergies, setAllergies] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            const res = await fetch(`${API}/api/memorials/${slug}/attendance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    plusOne,
                    allergies: allergies || undefined,
                }),
            });

            // Prøv å tolke JSON, men tåle tom body (204/201 uten body)
            let data: any = {};
            try {
                data = await res.json();
            } catch {
                /* ignorér tom respons */
            }

            if (!res.ok) {
                setMsg(data?.error ?? `Noe gikk galt (${res.status}).`);
                return;
            }

            onSuccess?.();
            setName("");
            setEmail("");
            setPlusOne(false);
            setAllergies("");
        } catch (e: any) {
            setMsg(String(e));
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
                <input
                    className="border rounded px-3 py-2"
                    placeholder="Navn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    className="border rounded px-3 py-2"
                    placeholder="E-post"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    id="plusOne"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={plusOne}
                    onChange={(e) => setPlusOne(e.target.checked)}
                />
                <label htmlFor="plusOne" className="text-sm">
                    Jeg tar med +1
                </label>
            </div>

            <input
                className="w-full border rounded px-3 py-2"
                placeholder="Allergier (valgfritt)"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
            />

            {msg && <p className="text-sm text-red-600">{msg}</p>}

            <div className="flex gap-2">
                <button
                    disabled={loading}
                    className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
                >
                    {loading ? "Sender…" : "Send påmelding"}
                </button>
                <button type="button" className="px-4 py-2 rounded border" onClick={onCancel}>
                    Avbryt
                </button>
            </div>
        </form>
    );
}