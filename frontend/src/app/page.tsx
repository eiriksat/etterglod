// frontend/src/app/page.tsx
import Link from "next/link";

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
    birthDate: string | null;
    deathDate: string | null;
    imageUrl: string | null;
    createdAt: string;
    ceremony?: { dateTime: string; venue: string | null; address: string | null } | null;
};

function formatDate(iso?: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("nb-NO", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}
// Ny hjelpefunksjon – legg den rett her:
function formatDateTime(iso?: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    const date = new Intl.DateTimeFormat("nb-NO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(d);
    const time = new Intl.DateTimeFormat("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
    return `${date} kl. ${time}`;
}
function withinNextDays(iso?: string | null, days = 10) {
    if (!iso) return false;
    const d = new Date(iso).getTime();
    const now = Date.now();
    const end = now + days * 24 * 60 * 60 * 1000;
    return d >= now && d <= end;
}

const API_BASE =
    (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith("http")
        ? process.env.NEXT_PUBLIC_API_URL
        : "https://api.etterglod.no") as string;

export default async function HomePage() {
    // Hent en liten liste og filtrér i server- komponenten
    const res = await fetch(`${API_BASE}/api/memorials?take=100`, {
        // statisk-ish forside, men oppdatér ofte nok
        next: { revalidate: 60 },
    });

    let upcoming: MemorialListItem[] = [];
    if (res.ok) {
        const json = await res.json();
        const items = (json?.items ?? []) as MemorialListItem[];
        upcoming = items
            .filter((m) => withinNextDays(m.ceremony?.dateTime, 10))
            .sort((a, b) => {
                const ta = new Date(a.ceremony?.dateTime ?? 0).getTime();
                const tb = new Date(b.ceremony?.dateTime ?? 0).getTime();
                return ta - tb;
            });
    }

    return (
        <main className="mx-auto max-w-4xl px-6 py-10 space-y-10">
            {/* Topp-tittel */}
            <header className="text-center">
                <h1 className="text-3xl font-semibold tracking-tight">Etterglød</h1>
            </header>

            {/* Intro-seksjon: tekst (venstre) + lite bilde (høyre) */}
            <section className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
                <div className="space-y-4">
                    <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed text-[17px]">
                        Når vi mister en vi er glad i, kan de praktiske oppgavene kjennes uoverkommelige. Etterglød
                        er laget for å gjøre det enklere å dele og finne informasjon om bisettelse og minnestund – ett
                        rolig og oversiktlig sted med tid, sted og eventuell påmelding. Slik kan familie og venner få
                        det de trenger, uten mer koordinering enn nødvendig.
                    </p>
                </div>

                {/* Bildet er mindre og sentrert i sin kolonne */}
                <div className="flex items-center justify-center">
                    <img
                        src="/hero/candle.png"
                        alt="Tent kubbelys"
                        className="w-[56%] max-w-[280px] h-auto rounded-xl shadow-sm ring-1 ring-black/5 object-contain"
                        loading="eager"
                        decoding="async"
                    />
                </div>
            </section>

            {/* Separator + god luft */}
            <hr className="border-zinc-200 dark:border-zinc-800" />

            {/* De neste 10 dagene */}
            <section className="space-y-4">
                <h2 className="text-lg font-medium">Seremonier de neste 10 dagene</h2>

                {upcoming.length === 0 ? (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Ingen publiserte bisettelser i løpet av de neste ti dagene.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {upcoming.map((m) => {
                            const birth = formatDate(m.birthDate);
                            const death = formatDate(m.deathDate);

                            return (
                                <li key={m.id}>
                                    <Link
                                        href={`/memorial/${m.slug}`}
                                        className="group block"
                                        prefetch={false}
                                    >
                                        {/* Hele kortet */}
                                        <div className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm hover:shadow transition">

                                            {/* Banner med dato + sted */}
                                            <div className="w-full rounded-t-xl bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                        {formatDateTime(m.ceremony?.dateTime ?? null)}
                                    </span>
                                                {m.ceremony?.venue && (
                                                    <span className="text-sm text-zinc-600 dark:text-zinc-300 truncate">
                                            {m.ceremony.venue}
                                        </span>
                                                )}
                                            </div>

                                            {/* Innholdsraden */}
                                            <div className="p-3 sm:p-4 flex items-center gap-3">
                                                {/* Thumb */}
                                                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-black/5 bg-zinc-100 dark:bg-zinc-900">
                                                    {m.imageUrl ? (
                                                        <img
                                                            src={m.imageUrl}
                                                            alt={m.name}
                                                            className="h-full w-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-xs text-zinc-500">
                                                            —
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tekst */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">
                                                        {m.name}
                                                    </div>
                                                    <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                                                        {birth && death
                                                            ? `${birth} – ${death}`
                                                            : birth || death || ""}
                                                    </div>
                                                </div>

                                                {/* Høyre kolonne – droppet dato (banner viser det) */}
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* Ekstra luft + separator før “Slik virker det” */}
            <div className="h-6" />
            <hr className="border-zinc-200 dark:border-zinc-800" />

            {/* Slik virker det (3 trinn) */}
            <section className="space-y-4">
                <h2 className="text-lg font-medium">Slik virker det</h2>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 sm:p-6 shadow-sm">
                    <ol className="space-y-4">
                        <li className="flex gap-3">
                            <div className="h-6 w-6 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center text-xs mt-0.5">
                                1
                            </div>
                            <p className="text-zinc-800 dark:text-zinc-200">
                                Opprett en minneside og velg en kort, tydelig adresse som kan brukes i dødsannonse
                                og invitasjoner.
                            </p>
                        </li>
                        <li className="flex gap-3">
                            <div className="h-6 w-6 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center text-xs mt-0.5">
                                2
                            </div>
                            <p className="text-zinc-800 dark:text-zinc-200">
                                Legg inn tid, sted og praktisk informasjon om bisettelse og minnestund – med
                                mulighet for påmelding ved behov.
                            </p>
                        </li>
                        <li className="flex gap-3">
                            <div className="h-6 w-6 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center text-xs mt-0.5">
                                3
                            </div>
                            <p className="text-zinc-800 dark:text-zinc-200">
                                Del adressen med familie og venner. Alle finner samme, oppdaterte informasjon på ett sted.
                            </p>
                        </li>
                    </ol>
                </div>
            </section>

            {/* Separator + footer */}
            <hr className="border-zinc-200 dark:border-zinc-800" />
            <footer className="py-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
                © {new Date().getFullYear()} Etterglød · Kontakt:{" "}
                <a className="underline" href="mailto:eiriksat@gmail.com">eiriksat@gmail.com</a>
            </footer>
        </main>
    );
}