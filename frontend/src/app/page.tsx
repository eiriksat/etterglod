"use client";

import { useEffect, useMemo, useState } from "react";

/** Stabil API-base: aldri undefined, aldri relativ */
const API = (() => {
    const env = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    if (typeof window === "undefined") {
        return process.env.NODE_ENV === "development"
            ? "http://localhost:4000"
            : env.startsWith("http") ? env : "https://api.etterglod.no";
    }
    return env.startsWith("http") ? env : "https://api.etterglod.no";
})();

/* ----------------------------- Typer ----------------------------- */

type Ceremony = {
    dateTime: string;
    venue: string;
    address?: string | null;
    mapUrl?: string | null;
};

type MemorialListItem = {
    id: number;
    slug: string;
    name: string;
    birthDate?: string | null;
    deathDate?: string | null;
    imageUrl?: string | null;
    createdAt: string;
    ceremony?: Pick<Ceremony, "dateTime" | "venue" | "address"> | null;
};

/* ----------------------------- Hjelpere ----------------------------- */

function withinNextDays(iso?: string | null, days = 10) {
    if (!iso) return false;
    const now = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    const d = new Date(iso);
    return d >= now && d <= end;
}

function formatDatoKort(iso?: string | null) {
    if (!iso) return "";
    return new Intl.DateTimeFormat("nb-NO").format(new Date(iso));
}

function formatSeremoniKort(iso?: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    const dato = new Intl.DateTimeFormat("nb-NO", {
        weekday: "long",
        day: "2-digit",
        month: "long",
    }).format(d);
    const klokke = new Intl.DateTimeFormat("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
    return `${dato.charAt(0).toUpperCase()}${dato.slice(1)} kl. ${klokke}`;
}

/* ----------------------------- Side ----------------------------- */

export default function HomePage() {
    const [memorials, setMemorials] = useState<MemorialListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setErr(null);
                const res = await fetch(`${API}/api/memorials?take=200`, { cache: "no-store" });
                if (!res.ok) throw new Error(`Kunne ikke hente liste (${res.status})`);
                const json = await res.json();
                const items: MemorialListItem[] = json?.items ?? [];
                setMemorials(items);
            } catch (e: any) {
                setErr(String(e?.message ?? e));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const upcoming = useMemo(() => {
        return memorials
            .filter(m => withinNextDays(m.ceremony?.dateTime, 10))
            .sort((a, b) => {
                const ad = new Date(a.ceremony?.dateTime ?? 0).getTime();
                const bd = new Date(b.ceremony?.dateTime ?? 0).getTime();
                return ad - bd;
            });
    }, [memorials]);

    return (
        <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">
            {/* Tittel */}
            <header className="text-center">
                <h1 className="text-3xl font-semibold tracking-tight">Etterglød</h1>
            </header>

            {/* Intro: Om + lite lys til høyre */}
            <section className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
                {/* Venstre: tekst (3/5) */}
                <div className="md:col-span-3 space-y-3">
                    <h2 className="text-xl font-medium tracking-tight">Om Etterglød</h2>
                    <p className="text-[17px] leading-relaxed text-zinc-800 dark:text-zinc-200">
                        Etterglød gir en verdig og enkel måte å dele praktisk informasjon om bisettelse og
                        minnestund. Hver minneside får en kort adresse (for eksempel <code>/ingvild68</code>)
                        som kan brukes i dødsannonser og invitasjoner. Siden samler tid, sted og eventuelt
                        påmelding, slik at familie og venner lett finner frem.
                    </p>
                    <p className="text-[17px] leading-relaxed text-zinc-800 dark:text-zinc-200">
                        Tjenesten er laget med fokus på ro, oversikt og verdighet – og med minst mulig friksjon
                        for de som skal formidle informasjon i en sårbar tid.
                    </p>
                </div>

                {/* Høyre: lite bilde (2/5) */}
                <div className="md:col-span-2 flex md:justify-end">
                    <img
                        src="/hero/candle.jpg"
                        alt="Brennende kubbelys"
                        className="rounded-xl shadow w-40 sm:w-48 md:w-56"
                        loading="eager"
                        decoding="async"
                    />
                </div>
            </section>

            {/* KOMMENDE SEREMONIER (neste 10 dager) */}
            <section className="space-y-4">
                <h2 className="text-xl font-medium tracking-tight">Kommende seremonier (neste 10 dager)</h2>

                {loading && <div className="text-zinc-600 dark:text-zinc-400 text-sm">Laster…</div>}
                {err && <div className="text-red-600 dark:text-red-400 text-sm">Feil: {err}</div>}

                {!loading && !err && upcoming.length === 0 && (
                    <div className="text-zinc-600 dark:text-zinc-400 text-sm">
                        Ingen seremonier registrert de neste dagene.
                    </div>
                )}

                <div className="space-y-3">
                    {upcoming.map((m) => {
                        const birth = formatDatoKort(m.birthDate);
                        const death = formatDatoKort(m.deathDate);
                        const tidspunkt = formatSeremoniKort(m.ceremony?.dateTime);
                        const venue = m.ceremony?.venue ?? "";

                        return (
                            <a
                                key={m.id}
                                href={`/memorial/${m.slug}`}
                                className={[
                                    "group block w-full rounded-xl border",
                                    "border-zinc-200 bg-white hover:bg-zinc-50",
                                    "dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900",
                                    "p-4 transition-colors"
                                ].join(" ")}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Tekst */}
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium truncate">
                                            {m.name}
                                        </div>
                                        <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                                            {[birth, death].filter(Boolean).join(" – ")}
                                        </div>
                                        {tidspunkt && (
                                            <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                                                {tidspunkt}{venue ? ` · ${venue}` : ""}
                                            </div>
                                        )}
                                    </div>
                                    {/* Thumbnail */}
                                    <div className="shrink-0">
                                        <div className="relative h-14 w-20 overflow-hidden rounded-lg ring-1 ring-black/5 dark:ring-white/10 bg-zinc-100 dark:bg-zinc-800">
                                            <img
                                                src={m.imageUrl || "/hero/candle.jpg"}
                                                alt=""
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>
            </section>

            {/* Luft */}
            <div className="h-8" />

            {/* Slik virker det (3 steg i ramme) */}
            <section>
                <h2 className="text-xl font-medium tracking-tight mb-3">Slik virker det</h2>
                <div className={[
                    "rounded-2xl border p-4 md:p-6",
                    "border-zinc-200 bg-white",
                    "dark:border-zinc-800 dark:bg-zinc-950"
                ].join(" ")}>
                    <ol className="space-y-4">
                        <li className="flex gap-3">
                            <div className="h-6 w-6 shrink-0 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center text-sm">1</div>
                            <div>
                                <div className="font-medium">Lag en minneside (kortadresse)</div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    Hver minneside får en enkel, kort adresse (f.eks. <code>/ingvild68</code>) som kan brukes i dødsannonser og invitasjoner.
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <div className="h-6 w-6 shrink-0 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center text-sm">2</div>
                            <div>
                                <div className="font-medium">Del praktisk informasjon</div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    Tid og sted for bisettelse og minnestund samles på ett sted. Eventuell påmelding kan aktiveres ved behov.
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <div className="h-6 w-6 shrink-0 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center text-sm">3</div>
                            <div>
                                <div className="font-medium">Del lenken – resten går av seg selv</div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    Familie og venner finner siden enkelt og holdes oppdatert uten ekstra koordinering.
                                </p>
                            </div>
                        </li>
                    </ol>
                </div>
            </section>

            {/* Separator + footer */}
            <hr className="border-zinc-200 dark:border-zinc-800" />
            <footer className="py-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
                © {new Date().getFullYear()} Etterglød · Kontakt: <a className="underline" href="mailto:eiriksat@gmail.com">eiriksat@gmail.com</a>
            </footer>
        </main>
    );
}