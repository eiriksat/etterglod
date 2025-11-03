export const metadata = {
    title: "Minnetale – Etterglød",
    description: "Engelsk versjon av minnetalen tilgjengelig under seremonien.",
};

export default function MinnetalePage() {
    return (
        <main className="mx-auto max-w-3xl p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Memorial Speech (English)</h1>
            <article className="prose prose-zinc dark:prose-invert">
                <p>
                    This page contains the English translation of the memorial speech,
                    made available for English-speaking guests attending the ceremony.
                </p>
            </article>
        </main>
    );
}