import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Browser-side Supabase client — use in Client Components only.
 * Uses the current publishable-key naming (replaces the legacy
 * NEXT_PUBLIC_SUPABASE_ANON_KEY). The publishable key carries the same
 * low privileges as the old anon key — RLS policies behave identically.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
