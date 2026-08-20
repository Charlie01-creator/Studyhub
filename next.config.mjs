/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Add your Supabase storage project host here, e.g.:
      // { protocol: "https", hostname: "xxxx.supabase.co", pathname: "/storage/v1/object/public/**" }
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
