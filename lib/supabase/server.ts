import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Server-side Supabase client — use in Server Components, Route Handlers,
 * and Server Actions.
 *
 * Next.js 16 removed synchronous access to `cookies()` entirely (it was
 * only a deprecated compatibility shim in 15), so this factory is now
 * async and every caller must `await createClient()`.
 *
 * Uses the getAll/setAll cookie methods (the current @supabase/ssr API —
 * the older per-cookie get/set/remove trio is legacy).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
    }
  );
}
