/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Supabase Storage (public buckets) — replace <project-ref> at deploy time.
      { protocol: "https", hostname: "*.supabase.co" },
      // LinkedIn / Google profile photos imported at signup (auth feature, built last).
      { protocol: "https", hostname: "media.licdn.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    // Server Actions are used for mutations alongside Route Handlers.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
