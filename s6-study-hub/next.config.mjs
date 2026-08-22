/**
 * next.config.mjs runs in Node during `next build`. Anything that throws
 * in here fails the ENTIRE Vercel build (not just a runtime request), so
 * this must never assume env vars are set — a missing env var here is a
 * worse failure mode than a missing env var at request time.
 */
function getSupabaseStorageRemotePattern() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  try {
    const { hostname } = new URL(url);
    return {
      protocol: "https",
      hostname,
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    // Malformed URL — don't crash the build over an image optimization
    // config; just skip the pattern. Someone will notice the missing
    // Supabase URL from the runtime errors this same misconfiguration
    // causes elsewhere (see lib/supabase/env.ts).
    return null;
  }
}

const supabaseRemotePattern = getSupabaseStorageRemotePattern();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseRemotePattern ? [supabaseRemotePattern] : [],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
