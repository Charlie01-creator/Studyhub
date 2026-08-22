import { listPapers, listSubjects, listAvailableYears } from "@/lib/papers/queries";
import { safeSupabase } from "@/lib/supabase/safe";
import { redirect } from "next/navigation";
import PapersFilters from "./PapersFilters";
import { PaperCard } from "@/components/papers/PaperCard";
import { FileQuestion, AlertTriangle } from "lucide-react";

export const metadata = { title: "Past Papers — S6 Study Hub" };

// Search params drive the query directly (no client-side fetch round-trip
// needed) — keeps this page a Server Component and the JS bundle small,
// per the mobile-first / low-bandwidth requirement.
export default async function PapersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; subject?: string; year?: string; paper?: string }>;
}) {
  const authCheck = await safeSupabase(async (supabase) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  });

  // Distinguish "Supabase is unreachable" from "genuinely not logged in" —
  // redirecting to /login when the real problem is a service outage would
  // just send someone to a login page that also can't reach Supabase.
  if (authCheck.error) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <AlertTriangle size={28} className="mx-auto text-marker-red" aria-hidden="true" />
        <h1 className="mt-3 text-lg font-semibold text-ink">Temporarily unavailable</h1>
        <p className="mt-2 text-sm text-slate">We&apos;re having trouble reaching the server. Please try again shortly.</p>
      </div>
    );
  }
  if (!authCheck.data) redirect("/login");

  const params = await searchParams;

  let papers: Awaited<ReturnType<typeof listPapers>> = [];
  let subjects: Awaited<ReturnType<typeof listSubjects>> = [];
  let years: number[] = [];
  let loadError: string | null = null;

  try {
    [papers, subjects, years] = await Promise.all([
      listPapers({
        search: params.q,
        subjectId: params.subject,
        year: params.year ? Number(params.year) : undefined,
        paperNumber: params.paper ? Number(params.paper) : undefined,
      }),
      listSubjects(),
      listAvailableYears(),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Something went wrong loading papers.";
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Past Papers</h1>
        <p className="text-sm text-slate">Browse, search and filter UACE past papers.</p>
      </div>

      <PapersFilters subjects={subjects} years={years} />

      {loadError && (
        <div role="alert" className="rounded-card bg-marker-red-soft px-4 py-3 text-sm text-marker-red">
          Couldn&apos;t load papers right now. Pull to refresh or try again shortly.
        </div>
      )}

      {!loadError && papers.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-ink/15 px-4 py-12 text-center">
          <FileQuestion size={28} className="text-slate" aria-hidden="true" />
          <p className="text-sm font-medium text-ink">No papers found</p>
          <p className="text-xs text-slate">Try a different subject, year, or search term.</p>
        </div>
      )}

      {!loadError && papers.length > 0 && (
        <ul className="space-y-3">
          {papers.map((paper) => (
            <li key={paper.id}>
              <PaperCard paper={paper} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
