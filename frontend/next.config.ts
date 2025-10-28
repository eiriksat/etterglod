import type { NextConfig } from "next";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            { source: "/api/:path*", destination: "https://api.etterglod.no/api/:path*" },
        ];
    },
};

export default nextConfig;