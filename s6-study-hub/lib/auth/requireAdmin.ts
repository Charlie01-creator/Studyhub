import "server-only";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server-side admin gate for /admin/** pages. This is a UX convenience,
 * NOT the security boundary — the actual enforcement is the database RLS
 * policies (papers_write_admin, storage papers_bucket_*_admin, spec
 * section 26: never rely on frontend checks alone). Even if this check
 * were skipped entirely, a non-admin still couldn't write papers or
 * upload files; this just gives them a clean redirect instead of a
 * confusing RLS error.
 *
 * If Supabase itself is unreachable/misconfigured, there's no valid
 * {user, supabase} to return — but we still must not let that surface as
 * an uncaught 500. Redirect home rather than crash; the home page has its
 * own guarded "temporarily unavailable" state.
 */
export async function requireAdmin() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_suspended")
      .eq("id", user.id)
      .single();

    if (!profile || profile.is_suspended || profile.role !== "admin") {
      redirect("/");
    }

    return { user, supabase };
  } catch (err) {
    // redirect() throws internally (Next's control-flow signal) — let
    // that pass through untouched, only swallow genuine Supabase errors.
    if (err && typeof err === "object" && "digest" in err) throw err;
    console.error("[requireAdmin] Supabase call failed:", err instanceof Error ? err.message : err);
    redirect("/");
  }
}
