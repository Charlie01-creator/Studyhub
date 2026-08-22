import "server-only";
import { createClient } from "./server";

/**
 * Wraps createClient() + a callback for pages/layouts that must not crash
 * the whole route if Supabase is unreachable or misconfigured. Returns
 * `{ data, error }` instead of throwing — every Server Component that
 * touches Supabase directly (rather than through lib/papers/queries.ts,
 * which has its own error handling per function) should go through this
 * rather than calling createClient() unguarded.
 *
 * This is deliberately generic (not specific to auth or to any one table)
 * so it doesn't require restructuring what each page already does with
 * its Supabase client — it just puts a safety net under it.
 */
export async function safeSupabase<T>(
  fn: (supabase: Awaited<ReturnType<typeof createClient>>) => Promise<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const data = await fn(supabase);
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[safeSupabase] Supabase call failed:", message);
    return { data: null, error: message };
  }
}
