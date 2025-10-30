// Server component: short URL → redirect til /memorial/[slug]
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // aldri prerender
export const revalidate = 0;

type ShortLookup = { ok: boolean; slug?: string; error?: string };

function apiBase(): string {
    const env = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    // På server: bruk env hvis gyldig; ellers prod fallback
    return env.startsWith("http") ? env : "https://api.etterglod.no";
}

export default async function ShortRedirect({
                                                params,
                                            }: {
    params: { code: string };
}) {
    const code = String(params?.code || "").trim().toLowerCase();

    // Korte sanity-sjekker – holdes liberale (tillater a–z, 0–9 og bindestrek)
    if (!code || !/^[a-z0-9-]{2,64}$/.test(code)) {
        notFound();
    }

    const API = apiBase();

    const res = await fetch(`${API}/api/short/${encodeURIComponent(code)}`, {
        // Viktig: ellers kan Next cache 404-responsen
        cache: "no-store",
    });

    if (!res.ok) {
        if (res.status === 404) {
            notFound();
        }
        throw new Error(`Short lookup failed (${res.status})`);
    }

    const data = (await res.json()) as ShortLookup;
    if (!data?.ok || !data.slug) {
        notFound();
    }

    // Intern redirect til “ekte” memorial-rute
    redirect(`/memorial/${data.slug}`);
}