import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";
import type { Database } from "@/types/database.types";

/**
 * Server-side Supabase client — use in Server Components, Route Handlers,
 * and Server Actions.
 *
 * Async because Next.js 16 requires `await cookies()`. Every caller in
 * this app wraps its use of this function in try/catch (see
 * lib/supabase/safe.ts) so a misconfiguration or transient outage fails
 * one page, not the whole deployment.
 */
export async function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component during rendering, where cookies
          // can't be set. Safe to ignore because proxy.ts refreshes the
          // session on every request (see lib/supabase/proxy.ts).
        }
      },
    },
  });
}
