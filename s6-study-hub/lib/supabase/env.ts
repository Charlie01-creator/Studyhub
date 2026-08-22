/**
 * Centralized, validated read of the Supabase env vars.
 *
 * Why this exists: every Supabase client factory in this app used to do
 * `process.env.NEXT_PUBLIC_SUPABASE_URL!` directly. If that var is
 * missing at runtime (classic Vercel mistake: env var added for
 * "Production" scope but not "Preview", or added after the last deploy —
 * NEXT_PUBLIC_* vars are inlined at BUILD time, so a var added after a
 * build simply isn't there until the next build), the `!` lies to
 * TypeScript, `undefined` gets passed to @supabase/ssr, and it throws an
 * opaque "supabaseUrl is required" deep in a dependency. That happens
 * inside proxy.ts, which runs on EVERY request before any page renders,
 * and inside the root layout, which wraps EVERY page — so a single missing
 * env var takes down the entire site as an unhelpful 500, including the
 * error page itself.
 *
 * This throws too (a missing Supabase URL is not something the app can
 * recover from), but with a message that actually says what's wrong and
 * shows up clearly in Vercel's function logs — and every caller of this
 * function wraps it in try/catch to fail one page/request gracefully
 * instead of the whole app.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!publishableKey) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (missing.length > 0) {
    throw new SupabaseConfigError(
      `Missing required env var(s): ${missing.join(", ")}. ` +
        `Set these in Vercel Project Settings > Environment Variables for ` +
        `EVERY environment you deploy to (Production AND Preview AND ` +
        `Development each have their own checkbox), then redeploy — ` +
        `NEXT_PUBLIC_* values are baked in at build time, so adding them ` +
        `after a build doesn't take effect until the next build.`
    );
  }

  return { url: url!, publishableKey: publishableKey! };
}

/** Distinct error type so callers can tell "misconfigured" apart from other Supabase errors in logs. */
export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}
