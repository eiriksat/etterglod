// src/app/env-debug/page.tsx  (server component som leser process.env)
export default function EnvDebugPage() {
    const guid = process.env.NEXT_PUBLIC_ADMIN_GUID;
    return (
        <main style={{padding: 16}}>
            <h1>Env Debug</h1>
            <pre>
        {`NEXT_PUBLIC_ADMIN_GUID: ${guid ?? "(undefined)"} (len=${guid?.length ?? 0})`}
      </pre>
        </main>
    );
}