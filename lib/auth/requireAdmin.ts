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
 */
export async function requireAdmin() {
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
}
