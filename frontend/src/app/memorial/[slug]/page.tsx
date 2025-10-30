"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

/** Stabil API-base: aldri undefined, aldri relativ */
const API = (() => {
    const env = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    // På server under dev -> localhost
    if (typeof window === "undefined") {
        return process.env.NODE_ENV === "development"
            ? "http://localhost:4000"
            : env.startsWith("http")
                ? env
                : "https://api.etterglod.no";
    }
    // I browseren -> bruk env hvis gyldig, ellers prod fallback
    return env.startsWith("http") ? env : "https://api.etterglod.no";
})();

/* ----------------------------- Typer ----------------------------- */

type Ceremony = {
    dateTime: string;
    venue: string;
    address?: string | null;
    mapUrl?: string | null;
    livestream?: string | null;
    otherInfo?: string | null;
};

type Reception = {
    dateTime: string; // ISO
    venue: string;
    address?: string | null;
    mapUrl?: string | null;
    welcomeScope: "OPEN" | "FAMILY" | "PRIVATE";
    wishes?: string | null;
};

type Memorial = {
    slug: string;
    name: string;
    birthDate?: string | null;
    deathDate?: string | null;
    bio?: string | null;
    imageUrl?: string | null;
    ceremony?: Ceremony | null;
    reception?: Reception | null;
    // notes kan eksistere men vi viser dem ikke offentlig nå
    notes?: { id: number; author: string; text: string; createdAt: string }[];
};

type Summary = {
    ok: true;
    totalConfirmed: number; // antall personer inkl. +1
    totalWaitlisted: number; // antall personer inkl. +1
    entriesConfirmed: number; // antall rader
    entriesWaitlisted: number;
    capacity: number; // kapasitet som backend rapporterer
};

/* ----------------------------- Hjelpere ----------------------------- */

function formatDatoKort(iso?: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("nb-NO").format(d); // dd.mm.åååå
}

function formatBisettelseTid(iso: string) {
    const d = new Date(iso);
    const dag = new Intl.DateTimeFormat("nb-NO", { weekday: "long" }).format(d);
    const dato = new Intl.DateTimeFormat("nb-NO", {
        day: "numeric",
        month: "long",
    }).format(d);
    const klokkeslett = new Intl.DateTimeFormat("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
    return `${capitalize(dag)} ${dato} kl. ${klokkeslett}`;
}

function capitalize(s: string) {
    return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function scopeLabel(scope: Reception["welcomeScope"]) {
    switch (scope) {
        case "OPEN":
            return "Åpent for alle som ønsker å delta";
        case "FAMILY":
            return "Primært for familie og nærmeste";
        case "PRIVATE":
            return "Privat arrangement";
    }
}

/* ----------------------------- Side ----------------------------- */

export default function MemorialPage() {
    const params = useParams<{ slug: string }>();
    const slug = params?.slug;

    const [memorial, setMemorial] = useState<Memorial | null>(null);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Påmelding inne i Minnestund-kortet
    const [showRsvp, setShowRsvp] = useState(false);

    async function refresh() {
        if (!slug) return;
        try {
            setLoading(true);
            setError(null);

            const [memRes, sumRes] = await Promise.all([
                fetch(`${API}/api/memorials/${slug}`, { cache: "no-store" }),
                fetch(`${API}/api/memorials/${slug}/attendance/summary`, {
                    cache: "no-store",
                }),
            ]);

            if (!memRes.ok) {
                throw new Error(`Kunne ikke hente minnesiden (${memRes.status})`);
            }

            const memJson = await memRes.json();
            setMemorial(memJson.item as Memorial);

            if (sumRes.ok) {
                const sumJson = (await sumRes.json()) as Summary;
                setSummary(sumJson);
            } else {
                setSummary(null);
            }
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

    const capacityLeft = useMemo(() => {
        if (!summary) return null;
        const left = Math.max(0, summary.capacity - summary.totalConfirmed);
        return left;
    }, [summary]);

    if (loading)
        return <main className="p-6 max-w-3xl mx-auto">Laster minneside…</main>;
    if (error) return <main className="p-6 max-w-3xl mx-auto">Feil: {error}</main>;
    if (!memorial)
        return <main className="p-6 max-w-3xl mx-auto">Ingen data funnet.</main>;

    const birth = formatDatoKort(memorial.birthDate);
    const death = formatDatoKort(memorial.deathDate);

    return (
        <main className="p-6 max-w-3xl mx-auto space-y-8">
            <header className="space-y-4">
                {/* Bilde (vises kun hvis backend har imageUrl) */}
                {memorial.imageUrl && (
                    <>
                        <img
                            src={memorial.imageUrl}
                            alt={`Portrett av ${memorial.name}`}
                            className="w-full max-h-[420px] object-cover rounded-lg shadow"
                            loading="eager"
                        />
                        <div className="text-xs text-white select-text">
                            img: {memorial.imageUrl}
                        </div>
                    </>
                )}

                <div className="space-y-2">
                    <h1 className="text-3xl font-semibold">{memorial.name}</h1>
                    <p className="text-gray-600">
                        {[formatDatoKort(memorial.birthDate), formatDatoKort(memorial.deathDate)]
                            .filter(Boolean)
                            .join(" – ")}
                    </p>
                    {memorial.bio && (
                        <p className="mt-2 leading-relaxed whitespace-pre-wrap">
                            {memorial.bio}
                        </p>
                    )}
                </div>
            </header>

            {/* BISETTELSE */}
            <section className="rounded border p-4 space-y-3">
                <h2 className="font-medium text-lg">Bisettelse</h2>
                {memorial.ceremony ? (
                    <div className="text-sm space-y-2">
                        <div>
                            <span className="text-gray-600">Sted: </span>
                            {memorial.ceremony.venue}
                        </div>
                        <div>
                            <span className="text-gray-600">Tid: </span>
                            {formatBisettelseTid(memorial.ceremony.dateTime)}
                        </div>
                        {memorial.ceremony.address && (
                            <div>
                                <span className="text-gray-600">Adresse: </span>
                                {memorial.ceremony.address}
                            </div>
                        )}
                        <div className="flex flex-wrap gap-3">
                            {memorial.ceremony.mapUrl && (
                                <a
                                    className="underline"
                                    href={memorial.ceremony.mapUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Åpne kirke i kart
                                </a>
                            )}
                            {memorial.ceremony.livestream && (
                                <a
                                    className="underline"
                                    href={memorial.ceremony.livestream}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Livestream
                                </a>
                            )}
                        </div>
                        {memorial.ceremony.otherInfo && (
                            <div className="pt-2">
                                <div className="text-gray-600">Annen informasjon:</div>
                                <p className="whitespace-pre-wrap">
                                    {memorial.ceremony.otherInfo}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-gray-600">Detaljer kommer.</p>
                )}
            </section>

            {/* MINNESTUND – visning + påmelding */}
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

                <ReceptionBlock reception={memorial.reception} />

                {/* Hvis vi har oppsummering, vis litt status */}
                {summary && (
                    <p className="text-xs text-gray-600">
                        Kapasitet: {summary.capacity}. Påmeldt (bekreftet):{" "}
                        {summary.totalConfirmed}
                        {summary.totalWaitlisted > 0
                            ? `, venteliste: ${summary.totalWaitlisted}`
                            : ""}
                        .
                        {typeof capacityLeft === "number"
                            ? ` Ledige plasser: ${capacityLeft}.`
                            : null}
                    </p>
                )}

                {/* Påmeldingsskjema */}
                {showRsvp && (
                    <div className="mt-4 border-t pt-4">
                        <RSVPForm
                            slug={memorial.slug}
                            onSuccess={() => {
                                setShowRsvp(false);
                                refresh();
                            }}
                            onCancel={() => setShowRsvp(false)}
                        />
                    </div>
                )}
            </section>
        </main>
    );
}

/* ------------------- Minnestund-blokk ------------------- */

function ReceptionBlock({ reception }: { reception?: Reception | null }) {
    if (!reception) {
        return (
            <div className="text-sm text-gray-600">
                Detaljer om minnestund er ikke publisert ennå.
            </div>
        );
    }

    const dt = new Date(reception.dateTime);
    const dato = new Intl.DateTimeFormat("nb-NO", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(dt);
    const klokke = new Intl.DateTimeFormat("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(dt);

    return (
        <div className="text-sm space-y-1">
            <div>
                <span className="text-gray-600">Tid:</span> {dato} kl. {klokke}
            </div>
            <div>
                <span className="text-gray-600">Sted:</span> {reception.venue}
            </div>
            {reception.address && (
                <div>
                    <span className="text-gray-600">Adresse:</span> {reception.address}
                </div>
            )}
            <div>
                <span className="text-gray-600">Velkommen:</span>{" "}
                {scopeLabel(reception.welcomeScope)}{" "}
                <span className="text-gray-500">(Begrenset antall plasser)</span>
            </div>
            {reception.mapUrl && (
                <a
                    className="underline"
                    href={reception.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                >
                    Åpne minnestund i kart
                </a>
            )}
            {reception.wishes && (
                <div className="pt-2">
                    <div className="text-gray-600">Ønsker for minnestunden:</div>
                    <p className="whitespace-pre-wrap">{reception.wishes}</p>
                </div>
            )}
        </div>
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
    const [allergyNotes, setAllergyNotes] = useState("");

    const [loading, setLoading] = useState(false);
    const [errMsg, setErrMsg] = useState<string | null>(null);
    const [okMsg, setOkMsg] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setErrMsg(null);
        setOkMsg(null);

        try {
            const res = await fetch(`${API}/api/memorials/${slug}/attendance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    plusOne,
                    allergies: allergyNotes || undefined,
                }),
            });

            let data: any = {};
            try {
                data = await res.json();
            } catch {
                /* tom respons ignoreres */
            }

            if (!res.ok) {
                setErrMsg(data?.error ?? `Noe gikk galt (${res.status}).`);
                return;
            }

            // Bruk melding fra backend hvis den finnes
            const text =
                (typeof data?.message === "string" && data.message) ||
                (data?.waitlisted
                    ? "Arrangementet er fulltegnet, men interessen din er registrert. Du får beskjed hvis det blir ledig kapasitet."
                    : "Takk! Påmeldingen er registrert.");

            setOkMsg(text);

            // Nullstill skjema
            setName("");
            setEmail("");
            setPlusOne(false);
            setAllergyNotes("");

            onSuccess?.();
        } catch (e: any) {
            setErrMsg(String(e?.message ?? e));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-3">
            {okMsg && (
                <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm">
                    {okMsg}
                </div>
            )}
            {errMsg && (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errMsg}
                </div>
            )}

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

                <textarea
                    className="w-full border rounded px-3 py-2 min-h-[90px]"
                    placeholder="Allergier (valgfritt) — du kan også legge inn korte kommentarer her"
                    value={allergyNotes}
                    onChange={(e) => setAllergyNotes(e.target.value)}
                />

                <div className="flex gap-2">
                    <button
                        disabled={loading}
                        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
                    >
                        {loading ? "Sender…" : "Send påmelding"}
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 rounded border"
                        onClick={onCancel}
                    >
                        Avbryt
                    </button>
                </div>
            </form>
        </div>
    );
}