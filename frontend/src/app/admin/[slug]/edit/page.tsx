"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// ✅ Trygg base-URL for API (alltid absolutt)
const API =
    process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith("http")
        ? process.env.NEXT_PUBLIC_API_URL
        : (typeof window === "undefined"
            ? "http://localhost:4000"       // server-side i dev
            : "https://api.etterglod.no");  // client-side i prod

// ✅ Token kan være tom lokalt – ikke bruk non-null (!) her
const TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "";

type WelcomeScope = "OPEN" | "FAMILY" | "PRIVATE";

type Ceremony = {
    dateTime: string;
    venue: string;
    address?: string | null;
    mapUrl?: string | null;
    livestream?: string | null;
};

type Reception = {
    dateTime: string;
    venue: string;
    address?: string | null;
    mapUrl?: string | null;
    welcomeScope: WelcomeScope;
    wishes?: string | null;
};

type Memorial = {
    slug: string;
    name: string;
    birthDate?: string | null;
    deathDate?: string | null;
    obituaryNote?: string | null;
    bio?: string | null;
    imageUrl?: string | null;
    ceremony?: Ceremony | null;
    reception?: Reception | null;
};

export default function AdminMemorialEditPage() {
    const params = useParams() as { slug: string };
    const slug = params.slug;

    const [memorial, setMemorial] = useState<Memorial | null>(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState<string | null>(null);

    const [mForm, setMForm] = useState({
        name: "",
        birthDate: "",
        deathDate: "",
        obituaryNote: "",
        bio: "",
        imageUrl: "",
    });

    const [cForm, setCForm] = useState<Ceremony>({
        dateTime: "",
        venue: "",
        address: "",
        mapUrl: "",
        livestream: "",
    });

    const [rForm, setRForm] = useState<Reception>({
        dateTime: "",
        venue: "",
        address: "",
        mapUrl: "",
        welcomeScope: "OPEN",
        wishes: "",
    });

    useEffect(() => {
        async function load() {
            if (!slug) return;
            setLoading(true);
            setMsg(null);
            try {
                const res = await fetch(`${API}/api/memorials/${slug}`);
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || "Kunne ikke hente data");
                const m: Memorial = json.item;
                setMemorial(m);

                setMForm({
                    name: m.name || "",
                    birthDate: m.birthDate ? m.birthDate.slice(0, 10) : "",
                    deathDate: m.deathDate ? m.deathDate.slice(0, 10) : "",
                    obituaryNote: m.obituaryNote || "",
                    bio: m.bio || "",
                    imageUrl: m.imageUrl || "",
                });

                setCForm({
                    dateTime: m.ceremony?.dateTime ? toLocalInputDateTime(m.ceremony.dateTime) : "",
                    venue: m.ceremony?.venue || "",
                    address: m.ceremony?.address || "",
                    mapUrl: m.ceremony?.mapUrl || "",
                    livestream: m.ceremony?.livestream || "",
                });

                setRForm({
                    dateTime: m.reception?.dateTime ? toLocalInputDateTime(m.reception.dateTime) : "",
                    venue: m.reception?.venue || "",
                    address: m.reception?.address || "",
                    mapUrl: m.reception?.mapUrl || "",
                    welcomeScope: (m.reception?.welcomeScope as WelcomeScope) || "OPEN",
                    wishes: m.reception?.wishes || "",
                });
            } catch (e: any) {
                setMsg(String(e.message || e));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [slug]);

    async function saveMemorial() {
        setMsg(null);
        const body = {
            name: mForm.name || undefined,
            birthDate: mForm.birthDate ? new Date(mForm.birthDate).toISOString() : undefined,
            deathDate: mForm.deathDate ? new Date(mForm.deathDate).toISOString() : undefined,
            obituaryNote: mForm.obituaryNote || undefined,
            bio: mForm.bio || undefined,
            imageUrl: mForm.imageUrl || undefined,
        };
        await callAuth("PUT", `${API}/api/memorials/${slug}`, body, setMsg, refresh);
    }

    async function saveCeremony() {
        setMsg(null);
        if (!cForm.dateTime || !cForm.venue) {
            setMsg("Seremoni trenger dato/tid og sted");
            return;
        }
        const body = {
            dateTime: toISOFromLocal(cForm.dateTime),
            venue: cForm.venue,
            address: cForm.address || null,
            mapUrl: cForm.mapUrl || null,
            livestream: cForm.livestream || null,
        };
        await callAuth("PUT", `${API}/api/memorials/${slug}/ceremony`, body, setMsg, refresh);
    }

    async function saveReception() {
        setMsg(null);
        if (!rForm.dateTime || !rForm.venue) {
            setMsg("Minnestund trenger dato/tid og sted");
            return;
        }
        const body = {
            dateTime: toISOFromLocal(rForm.dateTime),
            venue: rForm.venue,
            address: rForm.address || null,
            mapUrl: rForm.mapUrl || null,
            welcomeScope: rForm.welcomeScope,
            wishes: rForm.wishes || null,
        };
        await callAuth("PUT", `${API}/api/memorials/${slug}/reception`, body, setMsg, refresh);
    }

    function refresh() {
        // Enkel løsning: last siden på nytt for å hente ferske data
        location.reload();
    }

    if (loading) return <p className="p-6">Laster…</p>;
    if (!memorial) return <p className="p-6">{msg || "Finner ikke minnesiden."}</p>;

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-8">
            <header className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Rediger – {memorial.name}</h1>
                <div className="flex gap-3">
                    <Link href={`/memorial/${memorial.slug}`} className="underline">Åpne minneside</Link>
                    <Link href={`/admin/${memorial.slug}`} className="underline">Moderér minneord</Link>
                </div>
            </header>

            {msg && <p className="text-sm text-red-600">{msg}</p>}

            {/* Avdød-info */}
            <section className="rounded border p-4 space-y-3">
                <h2 className="font-medium text-lg">Avdød</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                    <Input label="Navn" value={mForm.name} onChange={(v) => setMForm({ ...mForm, name: v })} />
                    <Input type="date" label="Fødselsdato" value={mForm.birthDate} onChange={(v) => setMForm({ ...mForm, birthDate: v })} />
                    <Input type="date" label="Dødsdato" value={mForm.deathDate} onChange={(v) => setMForm({ ...mForm, deathDate: v })} />
                    <Input label="Bilde-URL" value={mForm.imageUrl} onChange={(v) => setMForm({ ...mForm, imageUrl: v })} />
                </div>
                <TextArea label='Dødsannonselinje (f.eks. "Sovnet stille inn...")' value={mForm.obituaryNote} onChange={(v) => setMForm({ ...mForm, obituaryNote: v })} />
                <TextArea label="Biografi/kort tekst" value={mForm.bio} onChange={(v) => setMForm({ ...mForm, bio: v })} />
                <div className="flex gap-2">
                    <Button onClick={saveMemorial}>Lagre avdød</Button>
                </div>
            </section>

            {/* Seremoni (kirke) */}
            <section className="rounded border p-4 space-y-3">
                <h2 className="font-medium text-lg">Seremoni (kirke)</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                    <Input type="datetime-local" label="Dato/tid" value={cForm.dateTime} onChange={(v) => setCForm({ ...cForm, dateTime: v })} />
                    <Input label="Sted/kirke" value={cForm.venue} onChange={(v) => setCForm({ ...cForm, venue: v })} />
                    <Input label="Adresse" value={cForm.address || ""} onChange={(v) => setCForm({ ...cForm, address: v })} />
                    <Input label="Kart-URL" value={cForm.mapUrl || ""} onChange={(v) => setCForm({ ...cForm, mapUrl: v })} />
                    <Input label="Livestream-URL" value={cForm.livestream || ""} onChange={(v) => setCForm({ ...cForm, livestream: v })} />
                </div>
                <div className="flex gap-2">
                    <Button onClick={saveCeremony}>Lagre seremoni</Button>
                </div>
            </section>

            {/* Minnestund (eget lokale) */}
            <section className="rounded border p-4 space-y-3">
                <h2 className="font-medium text-lg">Minnestund (eget lokale)</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                    <Input type="datetime-local" label="Dato/tid" value={rForm.dateTime} onChange={(v) => setRForm({ ...rForm, dateTime: v })} />
                    <Input label="Sted/lokale" value={rForm.venue} onChange={(v) => setRForm({ ...rForm, venue: v })} />
                    <Input label="Adresse" value={rForm.address || ""} onChange={(v) => setRForm({ ...rForm, address: v })} />
                    <Input label="Kart-URL" value={rForm.mapUrl || ""} onChange={(v) => setRForm({ ...rForm, mapUrl: v })} />
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Hvem er velkommen</label>
                        <select
                            className="border rounded px-3 py-2 w-full"
                            value={rForm.welcomeScope}
                            onChange={(e) => setRForm({ ...rForm, welcomeScope: e.target.value as WelcomeScope })}
                        >
                            <option value="OPEN">Alle som ønsker å delta</option>
                            <option value="FAMILY">Familie og slekt</option>
                            <option value="PRIVATE">Kun de nærmeste</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <TextArea label="Ønsker for minnestunden" value={rForm.wishes || ""} onChange={(v) => setRForm({ ...rForm, wishes: v })} />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={saveReception}>Lagre minnestund</Button>
                </div>
            </section>
        </div>
    );
}

/** UI helpers */
function Input({
                   label,
                   value,
                   onChange,
                   type = "text",
               }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
}) {
    return (
        <label className="text-sm space-y-1">
            <div className="font-medium">{label}</div>
            <input
                className="border rounded px-3 py-2 w-full"
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </label>
    );
}

function TextArea({
                      label,
                      value,
                      onChange,
                  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <label className="text-sm space-y-1 block">
            <div className="font-medium">{label}</div>
            <textarea
                className="border rounded px-3 py-2 w-full min-h-24"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </label>
    );
}

function Button({
                    children,
                    onClick,
                }: {
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="px-4 py-2 rounded bg-black text-white hover:opacity-90"
        >
            {children}
        </button>
    );
}

/** Dato helpers */
// "2025-11-01T12:00:00+01:00" -> "2025-11-01T12:00"
function toLocalInputDateTime(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
// "2025-11-01T12:00" (local) -> ISO
function toISOFromLocal(localDT: string) {
    const d = new Date(localDT);
    return d.toISOString();
}

/** Fetch helper m/ auth */
async function callAuth(
    method: "PUT" | "POST",
    url: string,
    body: any,
    setMsg: (s: string | null) => void,
    onOk?: () => void
) {
    try {
        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${TOKEN}`,
            },
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) {
            throw new Error(data?.error || `Feil (${res.status})`);
        }
        onOk?.();
    } catch (e: any) {
        setMsg(String(e.message || e));
    }
}