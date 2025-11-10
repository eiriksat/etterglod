"use client";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Page() {
  const { secret } = useParams<{ secret: string }>();
  const expected = (process.env.NEXT_PUBLIC_ADMIN_PATH || "").trim();
  const ok = Boolean(expected && secret === expected);

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin—debug</h1>
      <div className="rounded border p-3 text-sm">
        <div><b>secret fra URL:</b> {String(secret)}</div>
        <div><b>ENV expected:</b> {expected || "(tom)"}</div>
        <div><b>Path OK?</b> {ok ? "ja" : "nei"}</div>
      </div>
      <p className="text-sm text-zinc-600">Hvis denne siden vises umiddelbart, er det ikke Next som henger — da var det noe i den opprinnelige komponenten (f.eks. fetch/effect) som blokkerte.</p>
    </main>
  );
}
