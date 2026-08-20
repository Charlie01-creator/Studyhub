import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request. Wired up in
 * /proxy.ts (Next.js 16 renamed middleware.ts -> proxy.ts and moved it off
 * the Edge runtime onto Node.js; see /proxy.ts for why auth logic itself
 * stays out of this file — this only refreshes/passes along the session).
 *
 * Uses getClaims(), not getUser() or getSession(): getClaims() verifies the
 * JWT signature locally (or via a cached JWKS check) on every call, so it's
 * safe to trust here. getSession() must never be trusted in server code —
 * it isn't guaranteed to revalidate the token.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Required: refreshes the session (and syncs the refreshed cookie to both
  // the outgoing request and the browser response) — must not be removed,
  // and must run before any Server Component reads cookies this request.
  await supabase.auth.getClaims();

  return response;
}
