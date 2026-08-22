import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16: middleware.ts -> proxy.ts, `middleware` export -> `proxy`.
// This intentionally stays a "thin proxy": only session refresh happens
// here. Authoritative auth/role checks happen in Server Components using
// getClaims(), never here and never via getSession().
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|avif)$).*)",
  ],
};
