import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PaperFilters, PaperWithSubject, Subject } from "./types";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour — long enough to read a paper start-to-finish

/** Subjects for the filter dropdown. Cheap, cacheable, rarely changes. */
export async function listSubjects(): Promise<Subject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, code, category")
    .order("name");

  if (error) throw new Error(`Failed to load subjects: ${error.message}`);
  return data ?? [];
}

/** Distinct years present in the paper library, newest first, for the year filter. */
export async function listAvailableYears(): Promise<number[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("papers").select("year").order("year", { ascending: false });

  if (error) throw new Error(`Failed to load years: ${error.message}`);
  return Array.from(new Set((data ?? []).map((r) => r.year)));
}

export async function listPapers(filters: PaperFilters): Promise<PaperWithSubject[]> {
  const supabase = await createClient();

  let query = supabase
    .from("papers")
    .select("*, subjects(id, name, code)")
    .order("year", { ascending: false })
    .order("paper_number", { ascending: true });

  if (filters.subjectId) query = query.eq("subject_id", filters.subjectId);
  if (filters.year) query = query.eq("year", filters.year);
  if (filters.paperNumber) query = query.eq("paper_number", filters.paperNumber);
  if (filters.search && filters.search.trim().length > 0) {
    query = query.ilike("title", `%${filters.search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load papers: ${error.message}`);
  return (data ?? []) as PaperWithSubject[];
}

export async function getPaper(id: string): Promise<PaperWithSubject | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("papers")
    .select("*, subjects(id, name, code)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load paper: ${error.message}`);
  return data as PaperWithSubject | null;
}

/**
 * Resolves a stored object path to a short-lived signed URL. The `papers`
 * bucket is private (spec section 35 — past papers are often
 * copyrighted/licensed material, so we avoid permanent public links);
 * storage RLS still requires the caller to be authenticated for this to
 * succeed, enforced independently of this function.
 */
export async function getSignedPdfUrl(path: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("papers")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) throw new Error(`Could not generate a view link: ${error?.message ?? "unknown error"}`);
  return data.signedUrl;
}

/** Fire-and-forget-safe view recording — never throws into the render path. */
export async function recordPaperView(paperId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("paper_views").insert({ user_id: user.id, paper_id: paperId });
  if (error) {
    // Non-fatal: a student should never be blocked from reading a paper
    // because the view-tracking write failed.
    console.error("Failed to record paper view:", error.message);
  }
}

export async function listRecentlyViewedPapers(limit = 5): Promise<PaperWithSubject[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Over-fetch raw view rows, then dedupe by paper client-side — simplest
  // portable way to get "N most-recently-viewed distinct papers" without a
  // DISTINCT ON query tied to a specific Postgres dialect quirk.
  const { data: views, error } = await supabase
    .from("paper_views")
    .select("paper_id, viewed_at")
    .eq("user_id", user.id)
    .order("viewed_at", { ascending: false })
    .limit(limit * 4);

  if (error || !views || views.length === 0) return [];

  const seen = new Set<string>();
  const orderedIds: string[] = [];
  for (const v of views) {
    if (!seen.has(v.paper_id)) {
      seen.add(v.paper_id);
      orderedIds.push(v.paper_id);
    }
    if (orderedIds.length >= limit) break;
  }

  const { data: papers, error: papersError } = await supabase
    .from("papers")
    .select("*, subjects(id, name, code)")
    .in("id", orderedIds);

  if (papersError || !papers) return [];

  const byId = new Map(papers.map((p) => [p.id, p as PaperWithSubject]));
  return orderedIds.map((id) => byId.get(id)).filter((p): p is PaperWithSubject => Boolean(p));
}

export async function listPopularPapers(limit = 5): Promise<PaperWithSubject[]> {
  const supabase = await createClient();
  const { data: popular, error } = await supabase.rpc("get_popular_papers", { result_limit: limit });

  if (error || !popular || popular.length === 0) return [];

  const ids = popular.map((p) => p.paper_id);
  const { data: papers, error: papersError } = await supabase
    .from("papers")
    .select("*, subjects(id, name, code)")
    .in("id", ids);

  if (papersError || !papers) return [];

  const byId = new Map(papers.map((p) => [p.id, p as PaperWithSubject]));
  return ids.map((id) => byId.get(id)).filter((p): p is PaperWithSubject => Boolean(p));
}
