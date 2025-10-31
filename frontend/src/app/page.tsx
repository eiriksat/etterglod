import Link from "next/link";
import Image from "next/image";

export const metadata = {
    title: "Etterglød – en verdig digital minneside",
    description:
        "Etterglød er en enkel og verdig løsning for å dele praktisk informasjon om bisettelse og minnestund, og for påmelding til minnestunden.",
};

export default function HomePage() {
    return (
        <main className="min-h-[100svh] bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
            {/* Hero */}
            <section className="relative isolate">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-50 to-transparent dark:from-zinc-900/40"
                />
                <div className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
                    <div className="grid items-center gap-10 md:grid-cols-2">
                        <div className="space-y-4">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Etterglød – en verdig digital minneside
                            </h1>
                            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-[17px]">
                                Etterglød er en enkel og verdig løsning for å dele praktisk
                                informasjon i forbindelse med bisettelse og minnestund.
                                Familie og venner kan finne tid, sted og annen informasjon — og
                                melde seg på minnestunden direkte.
                            </p>
                            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-[17px]">
                                Hver avdød får sin egen, korte nettadresse som kan brukes i
                                dødsannonser, minneord og meldinger. Siden kan inneholde
                                portrettbilde, en kort tekst, detaljer om seremonien og
                                påmelding til minnestunden.
                            </p>

                            <div className="pt-2">
                                <Link
                                    href="/memorial/ingvild-saether-1968-2025"
                                    className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-white shadow hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
                                >
                                    Se et eksempel
                                    <span aria-hidden>→</span>
                                </Link>
                            </div>
                        </div>

                        {/* Hero-bilde (stearinlys) */}
                        <figure className="order-first md:order-last">
                            <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-sm">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none" />
                                {/* Bytt ut src når bildet ligger klart i /public/hero/candle.jpg */}
                                <Image
                                    src="/hero/candle.jpg"
                                    alt="Et tent stearinlys"
                                    width={1200}
                                    height={800}
                                    className="h-auto w-full object-cover"
                                    priority
                                />
                            </div>
                            <figcaption className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                                Et rolig øyeblikk — symbol på etterglød og minne.
                            </figcaption>
                        </figure>
                    </div>
                </div>
            </section>

            {/* Hvordan fungerer det */}
            <section className="mx-auto max-w-5xl px-6 pb-20">
                <div className="rounded-2xl border border-zinc-200 bg-white/60 p-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/40">
                    <h2 className="text-lg font-medium">Hvordan fungerer det?</h2>
                    <div className="mt-4 grid gap-6 sm:grid-cols-3">
                        <div>
                            <div className="text-2xl" aria-hidden>1.</div>
                            <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                                Opprett en minneside for avdøde — med navn, årstall og et kort
                                minneord.
                            </p>
                        </div>
                        <div>
                            <div className="text-2xl" aria-hidden>2.</div>
                            <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                                Del den korte nettadressen i dødsannonsen og meldinger.
                            </p>
                        </div>
                        <div>
                            <div className="text-2xl" aria-hidden>3.</div>
                            <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                                De nærmeste finner tid og sted — og kan melde seg på minnestunden.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-10 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    <p>© {new Date().getFullYear()} Etterglød. Laget med omtanke.</p>
                    <p className="mt-1">
                        Kontakt: <a className="underline" href="mailto:eirik.saether@akuna.no">Eirik Sæther</a>
                    </p>
                </footer>
            </section>
        </main>
    );
}