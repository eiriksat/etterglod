// frontend/next.config.ts
const nextConfig = {
    async rewrites() {
        return [
            { source: "/api/:path*", destination: "https://api.etterglod.no/api/:path*" },
        ];
    },
};

export default nextConfig;