// frontend/src/app/[code]/page.tsx
import { redirect, notFound } from "next/navigation";

/** Stabil API-base (server-side) */
function apiBase() {
    const env = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    if (env.startsWith("http")) return env;
    // fallback – prod
    return "https://api.etterglod.no";
}

type ShortLookup = { ok: true; slug: string } | { ok: false; error: string };

export default async function ShortCodePage({
                                                params,
                                            }: {
    params: { code: string };
}) {
    const code = (params?.code || "").trim().toLowerCase();
    if (!code) notFound();

    const API = apiBase();

    // Ikke cache – vi vil alltid ha fersk mapping
    const res = await fetch(`${API}/api/short/${encodeURIComponent(code)}`, {
        cache: "no-store",
        // kort timeout via Next.js runtime (kan droppes om ønskelig)
        // Next 14+ støtter { next: { revalidate: 0 } } også
    });

    if (!res.ok) {
        // 404 fra API -> vis 404-side i frontend
        if (res.status === 404) notFound();
        // annet -> kast feil for å se i Vercel-logs
        throw new Error(`Short lookup failed (${res.status})`);
    }

    const data = (await res.json()) as ShortLookup;
    if (!("ok" in data) || !data.ok || !data.slug) {
        notFound();
    }

    // Intern redirect til “ekte” memorial-rute
    redirect(`/memorial/${data.slug}`);
}