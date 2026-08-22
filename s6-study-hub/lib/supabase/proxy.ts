import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * Refreshes the Supabase auth session on every request. Wired up in
 * /proxy.ts (Next.js 16 renamed middleware.ts -> proxy.ts).
 *
 * CRITICAL for production reliability: this runs on every single request
 * before any page renders (see the matcher in /proxy.ts). If it throws —
 * e.g. because a Supabase env var isn't set for this deployment's
 * environment — the entire site 500s on every route, including error
 * pages, since nothing ever gets past this file. So this fails OPEN: on
 * any error, it logs and lets the request through unauthenticated rather
 * than blocking it. Downstream pages each re-check auth themselves (via
 * their own guarded createClient() call), so failing open here doesn't
 * grant access to anything — worst case, a page that needs auth shows its
 * own "please log in" or "service unavailable" state instead of the
 * request never completing at all.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  try {
    const { url, publishableKey } = getSupabaseEnv();

    const supabase = createServerClient(url, publishableKey, {
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
    });

    // Refreshes the session and syncs the refreshed cookie to both the
    // outgoing request and the browser response.
    await supabase.auth.getClaims();
  } catch (err) {
    console.error(
      "[proxy] Supabase session refresh failed — continuing request unauthenticated instead of 500ing the whole site:",
      err instanceof Error ? err.message : err
    );
  }

  return response;
}
