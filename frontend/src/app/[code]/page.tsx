// app/[code]/page.tsx (server-komponent)
import { notFound, redirect } from "next/navigation";

type ShortLookup =
    | { ok: true; slug: string }
    | { ok: false; error?: string };

export const dynamic = "force-dynamic"; // unngå cache i dev/edge

const API =
    process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
        ? process.env.NEXT_PUBLIC_API_URL!
        : "http://localhost:4000";

export default async function ShortRedirect(
    props: { params: Promise<{ code: string }> } // Next 15: params er en Promise
) {
    const { code: raw } = await props.params;
    const code = (raw ?? "").trim().toLowerCase();

    // enkel validering
    if (!code || !/^[a-z0-9-]{2,64}$/.test(code)) {
        notFound();
    }

    const res = await fetch(`${API}/api/short/${code}`, { cache: "no-store" });
    if (res.status === 404) notFound();
    if (!res.ok) throw new Error(`Short lookup failed (${res.status})`);

    const data = (await res.json()) as ShortLookup;
    if (!("ok" in data) || !data.ok || !data.slug) notFound();

    // Viktig: server-side redirect (gir 307/308 i nettleseren)
    redirect(`/memorial/${data.slug}`);
}